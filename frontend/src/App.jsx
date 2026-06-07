import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, LayoutDashboard, RefreshCw, CheckCircle2, ChevronRight, BrainCircuit, Activity, FileCheck2, Network, RefreshCcw, Trash2, Plus } from 'lucide-react';
import MermaidRenderer from './components/MermaidRenderer';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || 'https://intellecta-o64p.onrender.com';

export default function App() {
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [totalChunks, setTotalChunks] = useState(1);
  const [chunkIndices, setChunkIndices] = useState({ flashcards: 0, exercises: 0, test: 0, diagram: 0 });

  const [activeTab, setActiveTab] = useState('flashcards');

  // Generation States
  const [materials, setMaterials] = useState({
    flashcards: null,
    exercises: null,
    test: null,
    diagrams: []
  });
  const [genLoading, setGenLoading] = useState({
    flashcards: false,
    exercises: false,
    test: false,
    diagram: false
  });

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setSessionId(res.data.session_id);
      setPreviewText(res.data.preview);
      setTotalChunks(res.data.total_chunks || 1);
      setChunkIndices({ flashcards: 0, exercises: 0, test: 0, diagram: 0 });
    } catch (err) {
      setError(err.response?.data?.detail || "Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  const generateMaterial = async (type) => {
    if (!sessionId) return;
    setGenLoading(prev => ({ ...prev, [type]: true }));
    setError(null);
    
    try {
      const res = await axios.post(`${API_BASE}/generate/${type}`, { 
        session_id: sessionId,
        chunk_index: 0
      });
      setMaterials(prev => ({ ...prev, [type]: res.data.data }));
      setChunkIndices(prev => ({ ...prev, [type]: 0 }));
    } catch (err) {
      setError(`Failed to generate ${type}`);
    } finally {
      setGenLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const generateMoreMaterial = async (type) => {
    if (!sessionId) return;
    const nextChunk = chunkIndices[type] + 1;
    if (nextChunk >= totalChunks) {
      setError("You have extracted all possible questions from this document!");
      return;
    }
    
    setGenLoading(prev => ({ ...prev, [type]: true }));
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/generate/${type}`, { 
        session_id: sessionId,
        chunk_index: nextChunk 
      });
      
      setMaterials(prev => {
        if (type === 'exercises') {
          return {
            ...prev,
            exercises: {
              exercises: [...(prev.exercises?.exercises || []), ...(res.data.data.exercises || [])]
            }
          };
        } else if (type === 'test') {
          return {
            ...prev,
            test: {
              multiple_choice: [...(prev.test?.multiple_choice || []), ...(res.data.data.multiple_choice || [])],
              true_false: [...(prev.test?.true_false || []), ...(res.data.data.true_false || [])],
              short_answer: [...(prev.test?.short_answer || []), ...(res.data.data.short_answer || [])],
            }
          };
        }
        return prev;
      });
      setChunkIndices(prev => ({ ...prev, [type]: nextChunk }));
    } catch (err) {
      setError(`Failed to generate more ${type}`);
    } finally {
      setGenLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const generateDiagram = async (diagramType) => {
    if (!sessionId) return;
    setGenLoading(prev => ({ ...prev, diagram: true }));
    setError(null);
    
    try {
      const res = await axios.post(`${API_BASE}/generate/diagram`, { 
        session_id: sessionId,
        diagram_type: diagramType,
        chunk_index: chunkIndices.diagram
      });
      setMaterials(prev => ({ 
        ...prev, 
        diagrams: [...prev.diagrams, res.data.data] 
      }));
      setChunkIndices(prev => ({ ...prev, diagram: Math.min(prev.diagram + 1, totalChunks - 1) }));
    } catch (err) {
      setError(`Failed to generate diagram`);
    } finally {
      setGenLoading(prev => ({ ...prev, diagram: false }));
    }
  };

  const removeDiagram = (index) => {
    setMaterials(prev => ({
      ...prev,
      diagrams: prev.diagrams.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 p-4 gap-6 font-sans">
      {/* LEFT PANEL: Ingestion & Extraction */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="glass p-6 rounded-2xl flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/20 p-3 rounded-xl text-primary">
              <BrainCircuit size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Intellecta</h1>
          </div>
          
          <p className="text-slate-400 mb-6 text-sm">Upload a document to extract text and generate study materials dynamically.</p>

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-3 text-slate-400 group-hover:text-primary transition" />
              <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-slate-200">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-slate-500">PDF documents only</p>
            </div>
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
          </label>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-primary text-sm">
              <RefreshCw className="animate-spin w-4 h-4" /> Processing Document...
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 text-red-400 text-sm rounded-lg border border-red-900/50">
              {error}
            </div>
          )}

          {sessionId && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Text Extracted & Cached</span>
              </div>
              
              <div className="flex-1 bg-slate-950/50 rounded-xl p-4 border border-slate-800 overflow-y-auto min-h-[200px]">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Preview
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {previewText}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Generated Content */}
      <div className="w-full md:w-2/3 flex flex-col gap-4">
        {sessionId ? (
          <div className="glass p-6 rounded-2xl flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-slate-950/30 p-1.5 rounded-xl border border-slate-800/50">
              {[
                { id: 'flashcards', icon: <LayoutDashboard size={16}/>, label: 'Flashcards' },
                { id: 'exercises', icon: <Activity size={16}/>, label: 'Exercises' },
                { id: 'test', icon: <FileCheck2 size={16}/>, label: 'Practice Test' },
                { id: 'visuals', icon: <Network size={16}/>, label: 'Visual Diagrams' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              
              {/* FLASHCARDS */}
              {activeTab === 'flashcards' && (
                <div className="space-y-4">
                  {!materials.flashcards && !genLoading.flashcards && (
                     <GeneratePrompt 
                      title="Generate Flashcards" 
                      desc="Create a set of spaced-repetition flashcards based on the extracted text." 
                      onClick={() => generateMaterial('flashcards')} 
                     />
                  )}
                  {genLoading.flashcards && <LoadingIndicator />}
                  {materials.flashcards?.error && (
                    <div className="p-4 bg-red-900/20 text-red-400 border border-red-500 rounded-lg mt-4">
                      <strong>AI Generation Error:</strong> {materials.flashcards.error}
                    </div>
                  )}
                  {materials.flashcards?.flashcards && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button onClick={() => generateMaterial('flashcards')} className="text-sm flex items-center gap-2 text-primary hover:text-primary-hover transition"><RefreshCcw size={14}/> Regenerate</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {materials.flashcards.flashcards.map((fc, i) => (
                          <div key={i} className="group relative perspective-1000">
                            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-primary/50 transition duration-300">
                              <h3 className="font-bold text-lg text-primary mb-2">{fc.term}</h3>
                              <p className="text-sm text-slate-300">{fc.definition}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EXERCISES */}
              {activeTab === 'exercises' && (
                <div className="space-y-4">
                  {!materials.exercises && !genLoading.exercises && (
                     <GeneratePrompt 
                      title="Generate Exercises" 
                      desc="Create interactive mock problems to test comprehension." 
                      onClick={() => generateMaterial('exercises')} 
                     />
                  )}
                  {genLoading.exercises && <LoadingIndicator />}
                  {materials.exercises?.error && (
                    <div className="p-4 bg-red-900/20 text-red-400 border border-red-500 rounded-lg mt-4">
                      <strong>AI Generation Error:</strong> {materials.exercises.error}
                    </div>
                  )}
                  {materials.exercises?.exercises && (
                    <div className="space-y-4">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => generateMoreMaterial('exercises')} className="text-sm flex items-center gap-1 text-green-400 hover:text-green-300 transition"><Plus size={16}/> Generate More</button>
                        <button onClick={() => generateMaterial('exercises')} className="text-sm flex items-center gap-2 text-primary hover:text-primary-hover transition"><RefreshCcw size={14}/> Regenerate All</button>
                      </div>
                      {materials.exercises.exercises.map((ex, i) => (
                        <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                          <div className="flex gap-3 mb-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{i+1}</span>
                            <p className="text-slate-200 font-medium">{ex.question}</p>
                          </div>
                          <details className="mt-2 text-sm text-slate-400 group">
                            <summary className="cursor-pointer hover:text-primary mb-2">Show Answer & Hint</summary>
                            <div className="pl-9 space-y-2 pb-2">
                              <p><span className="text-yellow-400 font-semibold">Hint:</span> {ex.hint}</p>
                              <p><span className="text-green-400 font-semibold">Answer:</span> {ex.answer}</p>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PRACTICE TEST */}
              {activeTab === 'test' && (
                <div className="space-y-4">
                  {!materials.test && !genLoading.test && (
                     <GeneratePrompt 
                      title="Generate Practice Test" 
                      desc="Compile a formal test including Multiple Choice, True/False, and Short Answer." 
                      onClick={() => generateMaterial('test')} 
                     />
                  )}
                  {genLoading.test && <LoadingIndicator />}
                  {materials.test?.error && (
                    <div className="p-4 bg-red-900/20 text-red-400 border border-red-500 rounded-lg mt-4">
                      <strong>AI Generation Error:</strong> {materials.test.error}
                    </div>
                  )}
                  {materials.test && !materials.test.error && (
                    <div className="space-y-8">
                      <div className="flex justify-end gap-3 -mb-4">
                        <button onClick={() => generateMoreMaterial('test')} className="text-sm flex items-center gap-1 text-green-400 hover:text-green-300 transition"><Plus size={16}/> Generate More</button>
                        <button onClick={() => generateMaterial('test')} className="text-sm flex items-center gap-2 text-primary hover:text-primary-hover transition"><RefreshCcw size={14}/> Regenerate All</button>
                      </div>
                      {/* Multiple Choice */}
                      <section>
                        <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4">Multiple Choice</h3>
                        <div className="space-y-4">
                          {materials.test.multiple_choice?.map((q, i) => (
                            <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="font-medium mb-3">{i+1}. {q.question}</p>
                              <div className="space-y-2 pl-4">
                                {q.options.map((opt, j) => (
                                  <label key={j} className="flex items-center gap-2 text-sm text-slate-300">
                                    <input type="radio" name={`mcq-${i}`} className="accent-primary" /> {opt}
                                  </label>
                                ))}
                              </div>
                              <details className="mt-3 text-sm text-slate-500"><summary className="cursor-pointer hover:text-primary">Answer</summary><p className="mt-1 text-green-400">{q.correct_answer}</p></details>
                            </div>
                          ))}
                        </div>
                      </section>
                      {/* True False */}
                      <section>
                        <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4">True / False</h3>
                        <div className="space-y-4">
                          {materials.test.true_false?.map((q, i) => (
                            <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="font-medium mb-3">{i+1}. {q.question}</p>
                              <details className="mt-2 text-sm text-slate-500"><summary className="cursor-pointer hover:text-primary">Answer</summary><p className="mt-1 text-green-400">{q.correct_answer ? "True" : "False"}</p></details>
                            </div>
                          ))}
                        </div>
                      </section>
                      {/* Short Answer */}
                      <section>
                        <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4">Short Answer</h3>
                        <div className="space-y-4">
                          {materials.test.short_answer?.map((q, i) => (
                            <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="font-medium mb-3">{i+1}. {q.question}</p>
                              <details className="mt-2 text-sm text-slate-500"><summary className="cursor-pointer hover:text-primary">Guide</summary><p className="mt-1 text-green-400">{q.correct_answer_guide}</p></details>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              )}

              {/* VISUALS (Mermaid) */}
              {activeTab === 'visuals' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => generateDiagram('processes')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ Process Flow</button>
                    <button onClick={() => generateDiagram('comparisons')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ Comparison</button>
                    <button onClick={() => generateDiagram('hierarchies')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ Hierarchy</button>
                    <button onClick={() => generateDiagram('flowchart')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ Flowchart</button>
                    <button onClick={() => generateDiagram('block_diagram')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ Block Diagram</button>
                    <button onClick={() => generateDiagram('erd')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ ERD</button>
                    <button onClick={() => generateDiagram('venn')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ Venn concept</button>
                    <button onClick={() => generateDiagram('tree')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition">+ Tree</button>
                  </div>
                  
                  {genLoading.diagram && <LoadingIndicator />}
                  
                  {materials.diagrams.map((d, i) => (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={i} className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700 relative">
                      <button onClick={() => removeDiagram(i)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition" title="Remove Diagram"><Trash2 size={18}/></button>
                      <h3 className="text-xl font-bold text-white mb-1 pr-8">{d.title}</h3>
                      <p className="text-sm text-slate-400 mb-4">{d.description}</p>
                      {d.mermaid_code && <MermaidRenderer chart={d.mermaid_code} />}
                    </motion.div>
                  ))}

                  {materials.diagrams.length === 0 && !genLoading.diagram && (
                    <div className="text-center p-10 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                      Select a diagram type above to generate a visual mnemonic.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass flex-1 rounded-2xl flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <LayoutDashboard className="w-16 h-16 mb-4 text-slate-700" />
            <h2 className="text-xl font-medium text-slate-300 mb-2">Awaiting Document</h2>
            <p className="max-w-md">Upload a PDF document on the left to extract text and start generating interactive study materials.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const GeneratePrompt = ({ title, desc, onClick }) => (
  <div className="bg-slate-800/50 border border-primary/30 p-8 rounded-2xl text-center">
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-400 mb-6">{desc}</p>
    <button onClick={onClick} className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-primary/25 transition">
      Generate Now
    </button>
  </div>
);

const LoadingIndicator = () => (
  <div className="flex flex-col items-center justify-center p-12 text-primary">
    <RefreshCw className="animate-spin w-8 h-8 mb-4" />
    <p className="font-medium animate-pulse">Consulting the AI...</p>
  </div>
);
