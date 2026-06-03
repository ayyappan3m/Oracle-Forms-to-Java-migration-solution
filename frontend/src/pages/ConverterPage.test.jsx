import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import ConverterPage from './ConverterPage';

vi.mock('axios');

describe('ConverterPage', () => {
  const sampleResponse = {
    data: {
      javaCode: 'public class ConvertedCode {}',
      confidence: 0.92,
      triggerTier: 'SIMPLE',
      needsReview: false,
      migrationNote: 'Sample migration note.',
    },
  };

  beforeEach(() => {
    axios.post.mockResolvedValue(sampleResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all trigger type options', () => {
    render(<ConverterPage />);

    const triggerSelect = screen.getByLabelText(/trigger type/i);
    expect(triggerSelect).toBeInTheDocument();

    const options = Array.from(triggerSelect.querySelectorAll('option')).map((option) => option.value);
    expect(options).toEqual(['PROCEDURE', 'FUNCTION', 'TRIGGER', 'PACKAGE']);
  });

  it.each([
    ['PROCEDURE'],
    ['FUNCTION'],
    ['TRIGGER'],
    ['PACKAGE'],
  ])('submits the form and converts code for trigger type %s', async (triggerType) => {
    render(<ConverterPage />);

    const triggerSelect = screen.getByLabelText(/trigger type/i);
    const blockInput = screen.getByLabelText(/block\/package name/i);
    const codeTextarea = screen.getByLabelText(/pl\/sql code/i);
    const submitButton = screen.getByRole('button', { name: /convert to java/i });

    await userEvent.selectOptions(triggerSelect, triggerType);
    await userEvent.clear(blockInput);
    await userEvent.type(blockInput, 'ConvertedCode');
    await userEvent.type(codeTextarea, 'BEGIN NULL; END;');

    expect(triggerSelect.value).toBe(triggerType);

    await userEvent.click(submitButton);

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/api/convert', {
      triggerType,
      blockName: 'ConvertedCode',
      plsqlCode: 'BEGIN NULL; END;',
    });

    expect(await screen.findByText(/conversion result/i)).toBeInTheDocument();
    expect(screen.getByText(/public class ConvertedCode {}/i)).toBeInTheDocument();
  });
});
