package com.migration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConversionRequest {

    @NotBlank(message = "plsqlCode must not be blank")
    private String plsqlCode;

    @NotBlank(message = "triggerType must not be blank")
    private String triggerType;

    @NotBlank(message = "blockName must not be blank")
    private String blockName;
}
