package com.migration.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.migration.config.AnthropicProperties;
import com.migration.dto.ConversionRequest;
import com.migration.dto.ConversionResponse;

@Service
public class ConversionService {

    private static final Logger log = LoggerFactory.getLogger(ConversionService.class);

    private final AnthropicProperties anthropicProps;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
        You are an expert Oracle Forms PL/SQL to Java migration engineer.
        Convert the given PL/SQL code to clean, idiomatic Java code.

        RULES:
        1. PROCEDURE -> Convert to a Java public void method. Extract parameters from the PL/SQL signature and include them in the Java method signature. Convert Oracle types: NUMBER->double, VARCHAR2->String, DATE->LocalDateTime, BOOLEAN->boolean.
        2. FUNCTION -> Convert to a Java public method with proper return type. Extract parameters and return type from the PL/SQL signature. Convert RETURN statements to Java return.
        3. TRIGGER -> Convert to a Java public void method. The method name should reflect the trigger action (e.g., beforeInsertEmployee). Use an entity parameter (e.g., Employee employee). Convert :NEW.field to employee.getField()/employee.setField(), :OLD.field to oldEmployee.getField(). Convert SYSDATE to LocalDateTime.now(). Convert RAISE_APPLICATION_ERROR to throw new RuntimeException. Convert IF/THEN/END IF to proper Java if/else blocks.
        4. PACKAGE -> Convert to a full Java class. Use the Block/Package Name provided by the user as the class name. Each PROCEDURE becomes a public void method, each FUNCTION becomes a method with proper return type. Include all parameters with converted types. ALWAYS generate full method implementations — infer the logic from the function/procedure names, parameters, and return types. For example, AddNumbers(a, b) RETURN NUMBER should generate "return a + b;". Never generate TODO stubs or throw UnsupportedOperationException.

        TYPE MAPPINGS:
        - NUMBER, INTEGER -> double (or int if clearly integer usage)
        - VARCHAR2, CHAR, CLOB -> String
        - DATE -> LocalDateTime
        - BOOLEAN -> boolean
        - BLOB -> byte[]

        PL/SQL TO JAVA MAPPINGS:
        - := becomes =
        - || becomes + (string concatenation)
        - 'single quotes' become "double quotes"
        - DBMS_OUTPUT.PUT_LINE -> System.out.println
        - MESSAGE -> System.out.println
        - SYSDATE -> LocalDateTime.now()
        - SYSTIMESTAMP -> Instant.now()
        - NVL(a,b) -> Objects.requireNonNullElse(a, b)
        - TO_CHAR -> String.valueOf
        - TO_NUMBER -> Double.parseDouble
        - RAISE_APPLICATION_ERROR(-xxxxx, 'msg') -> throw new RuntimeException("msg")
        - IF condition THEN ... END IF -> if (condition) { ... }
        - FOR loop -> for loop
        - WHILE loop -> while loop
        - NULL; -> // no-op
        - BEGIN/END -> { }
        - EXCEPTION WHEN -> try/catch

        RESPONSE FORMAT:
        Return ONLY a JSON object with these exact fields (no markdown, no code fences):
        {
          "javaCode": "the complete converted Java code as a single string",
          "triggerTier": "SIMPLE or MODERATE or COMPLEX",
          "confidence": 0.95,
          "needsReview": false,
          "migrationNote": "brief explanation of the conversion"
        }

        triggerTier guidelines:
        - SIMPLE: Direct 1:1 translation, no SQL, no complex logic
        - MODERATE: Contains IF/ELSE, simple SQL, or type conversions
        - COMPLEX: Contains cursors, dynamic SQL, exception handling, or complex business logic

        confidence guidelines:
        - 0.95-1.0: Clean direct translation
        - 0.80-0.94: Minor assumptions made
        - 0.60-0.79: Some constructs need manual review
        - Below 0.60: Significant manual work needed

        IMPORTANT: Return ONLY the raw JSON. No markdown formatting, no ```json blocks.
        """;

    public ConversionService(AnthropicProperties anthropicProps) {
        this.anthropicProps = anthropicProps;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public ConversionResponse convert(ConversionRequest request) {
        String apiKey = anthropicProps.getSecret();

        // If no API key, fall back to rule-based conversion
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("No Anthropic API key configured. Using fallback rule-based conversion.");
            return fallbackConvert(request);
        }

        try {
            return claudeConvert(request, apiKey);
        } catch (Exception e) {
            log.error("Claude API call failed, falling back to rule-based conversion: {}", e.getMessage());
            return fallbackConvert(request);
        }
    }

    /**
     * Calls Claude API to convert PL/SQL to Java.
     */
    private ConversionResponse claudeConvert(ConversionRequest request, String apiKey) throws Exception {
        String userPrompt = String.format(
                "Convert this %s PL/SQL code to Java.\nBlock/Package Name: %s\n\nPL/SQL Code:\n```sql\n%s\n```",
                request.getTriggerType(),
                request.getBlockName(),
                request.getPlsqlCode()
        );

        // Build the Claude API request body
        String requestBody = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "model", anthropicProps.getModel() != null ? anthropicProps.getModel() : "claude-sonnet-4-5-20250929",
                        "max_tokens", anthropicProps.getMaxTokens() > 0 ? anthropicProps.getMaxTokens() : 4096,
                        "system", SYSTEM_PROMPT,
                        "messages", java.util.List.of(
                                java.util.Map.of("role", "user", "content", userPrompt)
                        )
                )
        );

        String url = (anthropicProps.getApiUrl() != null && !anthropicProps.getApiUrl().isBlank())
                ? anthropicProps.getApiUrl()
                : "https://api.anthropic.com/v1/messages";

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        log.info("Calling Claude API for {} conversion of block: {}", request.getTriggerType(), request.getBlockName());

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Claude API returned status {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Claude API returned status " + response.statusCode());
        }

        // Parse Claude's response
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode contentArray = root.get("content");
        if (contentArray == null || !contentArray.isArray() || contentArray.isEmpty()) {
            throw new RuntimeException("Empty response from Claude API");
        }

        String claudeText = contentArray.get(0).get("text").asText();
        log.debug("Claude raw response: {}", claudeText);

        // Clean up response - remove any markdown fences if present
        claudeText = claudeText.trim();
        if (claudeText.startsWith("```json")) {
            claudeText = claudeText.substring(7);
        }
        if (claudeText.startsWith("```")) {
            claudeText = claudeText.substring(3);
        }
        if (claudeText.endsWith("```")) {
            claudeText = claudeText.substring(0, claudeText.length() - 3);
        }
        claudeText = claudeText.trim();

        // Parse the JSON response from Claude
        JsonNode result = objectMapper.readTree(claudeText);

        return ConversionResponse.builder()
                .javaCode(result.get("javaCode").asText())
                .triggerTier(result.has("triggerTier") ? result.get("triggerTier").asText() : "MODERATE")
                .confidence(result.has("confidence") ? result.get("confidence").asDouble() : 0.85)
                .needsReview(result.has("needsReview") ? result.get("needsReview").asBoolean() : true)
                .migrationNote(result.has("migrationNote") ? result.get("migrationNote").asText() : "Converted using Claude AI")
                .build();
    }

    /**
     * Fallback rule-based conversion when Claude API is not available.
     */
    private ConversionResponse fallbackConvert(ConversionRequest request) {
        String javaCode = "// Auto-generated fallback (Claude API not available)\n"
                + "// TODO: Set anthropic.apiKey in application.properties for AI-powered conversion\n"
                + "// Trigger Type: " + request.getTriggerType() + "\n"
                + "// Block Name: " + request.getBlockName() + "\n"
                + "// Original PL/SQL:\n"
                + "/*\n" + request.getPlsqlCode() + "\n*/\n";

        return ConversionResponse.builder()
                .javaCode(javaCode)
                .triggerTier("COMPLEX")
                .confidence(0.0)
                .needsReview(true)
                .migrationNote("Claude API key not configured. Set anthropic.apiKey in application.properties for AI-powered conversion.")
                .build();
    }
}
