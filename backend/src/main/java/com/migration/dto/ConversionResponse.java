package com.migration.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConversionResponse {

    /** The generated Java/Spring Boot method or class body. */
    private String javaCode;

    /**
     * Migration complexity tier for this trigger.
     * One of: SIMPLE, MODERATE, COMPLEX
     */
    private String triggerTier;

    /** Confidence score 0.0–1.0 that the conversion is correct. */
    private double confidence;

    /** True when the generated code contains TODOs or unresolvable PL/SQL constructs. */
    private boolean needsReview;

    /** Human-readable explanation of what was converted and any caveats. */
    private String migrationNote;
}
