import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

export default function MermaidRenderer({ chart }) {
  const [svgStr, setSvgStr] = useState('');
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (chart) {
      const renderChart = async () => {
        try {
          // Clear previous error
          setError(false);
          // Generate a unique ID for the mermaid element
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvgStr(svg);
        } catch (e) {
          console.error("Mermaid rendering error:", e);
          setError(true);
        }
      };
      renderChart();
    }
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-200">
        <p className="font-semibold">Failed to render diagram.</p>
        <pre className="text-sm mt-2 overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      className="flex justify-center items-center p-4 bg-slate-800/50 rounded-xl overflow-x-auto glass"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svgStr }} 
    />
  );
}
