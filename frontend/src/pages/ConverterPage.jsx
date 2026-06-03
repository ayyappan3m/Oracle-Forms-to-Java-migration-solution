import { useState } from 'react';
import axios from 'axios';
import '../styles/ConverterPage.css';

export default function ConverterPage() {
  const [formData, setFormData] = useState({
    plsqlCode: '',
    triggerType: 'PROCEDURE',
    blockName: 'ConvertedCode'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:8080/api/convert', formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="converter-page">
      <div className="container">
        <h1>🔄 Oracle Forms to Java Converter</h1>
        <p className="subtitle">Convert PL/SQL code to Java automatically using AI</p>

        <div className="content">
          <div className="input-section">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="triggerType">Trigger Type</label>
                <select
                  id="triggerType"
                  name="triggerType"
                  value={formData.triggerType}
                  onChange={handleInputChange}
                >
                  <option value="PROCEDURE">Procedure</option>
                  <option value="FUNCTION">Function</option>
                  <option value="TRIGGER">Trigger</option>
                  <option value="PACKAGE">Package</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="blockName">Block/Package Name</label>
                <input
                  id="blockName"
                  type="text"
                  name="blockName"
                  value={formData.blockName}
                  onChange={handleInputChange}
                  placeholder="e.g., ConvertedCode"
                />
              </div>

              <div className="form-group">
                <label htmlFor="plsqlCode">PL/SQL Code</label>
                <textarea
                  id="plsqlCode"
                  name="plsqlCode"
                  value={formData.plsqlCode}
                  onChange={handleInputChange}
                  placeholder="Paste your PL/SQL code here..."
                  rows="12"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-convert">
                {loading ? 'Converting...' : 'Convert to Java'}
              </button>
            </form>
          </div>

          <div className="output-section">
            {error && (
              <div className="error-message">
                <h3>❌ Error</h3>
                <p>{error}</p>
              </div>
            )}

            {result && (
              <div className="result-container">
                <div className="result-header">
                  <h3>✅ Conversion Result</h3>
                  <button
                    className="btn-copy"
                    onClick={() => handleCopy(result.javaCode)}
                  >
                    📋 Copy Code
                  </button>
                </div>

                <div className="result-metadata">
                  <div className="metadata-item">
                    <strong>Confidence:</strong>
                    <span className="confidence-badge">{(result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="metadata-item">
                    <strong>Complexity:</strong>
                    <span className={`tier-badge tier-${result.triggerTier.toLowerCase()}`}>
                      {result.triggerTier}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <strong>Needs Review:</strong>
                    <span className={`review-badge ${result.needsReview ? 'yes' : 'no'}`}>
                      {result.needsReview ? '⚠️ Yes' : '✓ No'}
                    </span>
                  </div>
                </div>

                <div className="java-code">
                  <h4>Generated Java Code:</h4>
                  <pre><code>{result.javaCode}</code></pre>
                </div>

                {result.migrationNote && (
                  <div className="migration-note">
                    <h4>📝 Migration Notes:</h4>
                    <p>{result.migrationNote}</p>
                  </div>
                )}
              </div>
            )}

            {!result && !error && !loading && (
              <div className="empty-state">
                <p>Your Java conversion will appear here...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
