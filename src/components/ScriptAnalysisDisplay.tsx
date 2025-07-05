import React from 'react';
import { 
  BookOpen, 
  Target, 
  Brain, 
  Search, 
  Users, 
  MessageCircle, 
  Lightbulb, 
  FileText, 
  Globe, 
  BookMarked, 
  Bookmark, 
  Settings, 
  GraduationCap,
  Star,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  Trophy,
  TrendingUp,
  Zap,
  Heart,
  Sparkles
} from 'lucide-react';

const ScriptAnalysisDisplay = ({ analysisResult, type }) => {
  // Clean source citations from text
  const cleanText = (text) => {
    return text.replace(/【\d+:\d+†source】/g, '').trim();
  };

  // Parse markdown content into structured sections
  const parseMarkdown = (content) => {
    const cleanContent = cleanText(content);
    const sections = [];
    const lines = cleanContent.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (let line of lines) {
      line = line.trim();
      
      if (line.startsWith('📘 Script Title:')) {
        sections.push({
          type: 'title',
          content: line.replace('📘 Script Title:', '').trim()
        });
      } else if (line.startsWith('🎯 Submitted Idea:')) {
        sections.push({
          type: 'idea',
          content: line.replace('🎯 Submitted Idea:', '').trim()
        });
      } else if (line.startsWith('🧠 OVERALL')) {
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n')
          });
        }
        currentSection = 'overall';
        currentContent = [line.replace(/🧠 OVERALL.*?:/, '').trim()];
      } else if (line.startsWith('🔍 DETAILED EVALUATION:') || line.startsWith('🔍 ANALYSIS BREAKDOWN:')) {
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n')
          });
        }
        currentSection = 'detailed';
        currentContent = [];
      } else if (line.startsWith('📚 READING MATERIAL')) {
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n')
          });
        }
        currentSection = 'reading';
        currentContent = [];
      } else if (line.startsWith('🔖 SECTIONS TO REFER')) {
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n')
          });
        }
        currentSection = 'sections';
        currentContent = [];
      } else if (line.startsWith('🛠️') && (line.includes('RECOMMENDATIONS') || line.includes('RECOMMENDATION'))) {
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n')
          });
        }
        currentSection = 'recommendations';
        currentContent = [];
      } else if (line.startsWith('📊 SCORECARD')) {
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n')
          });
        }
        currentSection = 'scorecard';
        currentContent = [];
      } else if (line.startsWith('🎓 MENTOR') || line.startsWith('🎓 Mentor')) {
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n')
          });
        }
        currentSection = 'mentor';
        currentContent = [line.replace(/🎓 Mentor.*?:/, '').trim()];
      } else if (line !== '---' && line !== '') {
        if (currentContent.length > 0 || line.trim() !== '') {
          currentContent.push(line);
        }
      }
    }

    if (currentSection) {
      sections.push({
        type: currentSection,
        content: currentContent.join('\n')
      });
    }

    return sections;
  };

  const renderFormattedText = (text) => {
    const cleanedText = cleanText(text);
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = cleanedText.split(boldRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold text-gray-900">{part}</strong>;
      }
      return part;
    });
  };

  const renderDetailedSection = (content) => {
    const cleanedContent = cleanText(content);
    const items = cleanedContent.split(/\d+\.\s\*\*/).filter(item => item.trim());
    
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item, index) => {
          const [title, ...contentParts] = item.split('**');
          const itemContent = contentParts.join('**').trim();
          
          if (!title || !itemContent) return null;
          
          const getIcon = (title) => {
            const titleLower = title.toLowerCase();
            if (titleLower.includes('concept') || titleLower.includes('originality')) return <Lightbulb className="h-6 w-6" />;
            if (titleLower.includes('structure') || titleLower.includes('pacing')) return <BarChart3 className="h-6 w-6" />;
            if (titleLower.includes('character')) return <Users className="h-6 w-6" />;
            if (titleLower.includes('dialogue')) return <MessageCircle className="h-6 w-6" />;
            if (titleLower.includes('theme') || titleLower.includes('message')) return <Target className="h-6 w-6" />;
            if (titleLower.includes('format')) return <FileText className="h-6 w-6" />;
            if (titleLower.includes('relevance') || titleLower.includes('market')) return <Globe className="h-6 w-6" />;
            return <CheckCircle className="h-6 w-6" />;
          };
          
          const getGradient = (index) => {
            const gradients = [
              'from-blue-500 to-cyan-500',
              'from-emerald-500 to-green-500',
              'from-purple-500 to-pink-500',
              'from-orange-500 to-red-500',
              'from-indigo-500 to-blue-500',
              'from-pink-500 to-rose-500',
              'from-teal-500 to-cyan-500'
            ];
            return gradients[index % gradients.length];
          };
          
          return (
            <div key={index} className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(index)} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className="relative p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(index)} text-white mb-4 shadow-lg`}>
                  {getIcon(title)}
                </div>
                <h4 className="font-bold text-xl text-gray-900 mb-3">{title.trim()}</h4>
                <div className="text-gray-600 leading-relaxed space-y-2">
                  {itemContent.split('\n').map((line, lineIndex) => (
                    <p key={lineIndex} className="text-sm">
                      {line.trim().startsWith('-') ? (
                        <span className="ml-4 block flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          {renderFormattedText(line.trim().substring(1).trim())}
                        </span>
                      ) : (
                        renderFormattedText(line.trim())
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReadingMaterial = (content) => {
    const cleanedContent = cleanText(content);
    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const materials = [];
    
    lines.forEach(line => {
      if (line.trim().startsWith('-')) {
        materials.push(line.trim().substring(1).trim());
      } else if (line.includes('**') && !line.startsWith('📚')) {
        materials.push(line.trim());
      }
    });
    
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {materials.map((material, index) => (
          <div key={index} className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-emerald-800 font-medium">{renderFormattedText(material)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSections = (content) => {
    const cleanedContent = cleanText(content);
    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const sections = [];
    
    lines.forEach(line => {
      if (line.trim().startsWith('-')) {
        sections.push(line.trim().substring(1).trim());
      } else if (line.includes('"') && !line.startsWith('🔖')) {
        sections.push(line.trim());
      }
    });
    
    return (
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:shadow-md transition-all duration-300">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white shadow-md">
              <Bookmark className="h-4 w-4" />
            </div>
            <span className="text-amber-800 font-medium">{renderFormattedText(section)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderScorecard = (content) => {
    const cleanedContent = cleanText(content);
    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const scores = [];
    let totalScore = null;
    
    lines.forEach(line => {
      // Updated regex to handle asterisks around content
      const match = line.match(/\|\s*\**(.*?)\*\*\s*\|\s*\*\*(\d+\/\d+)\*\*\s*\|/) || 
                   line.match(/\|\s*(.+?)\s*\|\s*(\d+\/\d+)\s*\|/);
      if (match) {
        const [, category, score] = match;
        const cleanCategory = category.replace(/\*/g, '').trim();
        if (cleanCategory !== 'Category' && score && cleanCategory) {
          scores.push({ category: cleanCategory, score: score.replace(/\*/g, '').trim() });
          if (cleanCategory.toLowerCase().includes('total')) {
            totalScore = score.replace(/\*/g, '').trim();
          }
        }
      }
    });
    
    const totalMatch = totalScore ? totalScore.match(/(\d+)\/(\d+)/) : null;
    const totalPercentage = totalMatch ? (parseInt(totalMatch[1]) / parseInt(totalMatch[2])) * 100 : 0;
    
    return (
      <div className="space-y-8">
        {/* Total Score Card */}
        {totalScore && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Overall Score</h3>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{totalScore}</div>
                  <div className="text-white/80 text-sm">{totalPercentage.toFixed(0)}% Performance</div>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${totalPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-20">
              <Sparkles className="h-24 w-24" />
            </div>
          </div>
        )}
        
        {/* Individual Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scores.map((item, index) => {
            const [current, total] = item.score.split('/').map(Number);
            const percentage = (current / total) * 100;
            const isTotal = item.category.toLowerCase().includes('total');
            
            // Hide the total as a regular card since it's already shown above
            if (isTotal) return null;
            
            const getScoreColor = (percentage) => {
              if (percentage >= 80) return {
                gradient: 'from-green-500 to-emerald-500',
                bg: 'bg-green-50',
                text: 'text-green-700',
                ring: 'ring-green-200'
              };
              if (percentage >= 60) return {
                gradient: 'from-yellow-500 to-orange-500',
                bg: 'bg-yellow-50',
                text: 'text-yellow-700',
                ring: 'ring-yellow-200'
              };
              return {
                gradient: 'from-red-500 to-pink-500',
                bg: 'bg-red-50',
                text: 'text-red-700',
                ring: 'ring-red-200'
              };
            };
            
            const colors = getScoreColor(percentage);
            
            return (
              <div key={index} className={`relative overflow-hidden rounded-xl ${colors.bg} ${colors.ring} ring-1 p-6 hover:shadow-lg transition-all duration-300 group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center text-white shadow-lg`}>
                    <Star className="h-5 w-5" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${colors.text} bg-white shadow-sm`}>
                    {item.score}
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-3">{item.category}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className={`font-medium ${colors.text}`}>{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sections = parseMarkdown(analysisResult);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="space-y-12">
        {sections.map((section, index) => {
          switch (section.type) {
            case 'title':
              return (
                <div key={index} className="text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <BookOpen className="h-8 w-8" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {renderFormattedText(section.content)}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-gray-600">Script Analysis Report</p>
                          {type && (
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-full font-medium">
                              {type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
              
            case 'idea':
              return (
                <div key={index} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 p-8 shadow-lg">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Target className="h-32 w-32" />
                  </div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-cyan-900 mb-4">Submitted Idea</h2>
                      <p className="text-gray-700 leading-relaxed text-lg">{renderFormattedText(section.content)}</p>
                    </div>
                  </div>
                </div>
              );
              
            case 'overall':
              return (
                <div key={index} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-8 shadow-lg">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Brain className="h-32 w-32" />
                  </div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-purple-900 mb-4">Overall Assessment</h2>
                      <p className="text-gray-700 leading-relaxed text-lg">{renderFormattedText(section.content)}</p>
                    </div>
                  </div>
                </div>
              );
              
            case 'detailed':
              return (
                <div key={index} className="space-y-8">
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Search className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Detailed Analysis</h2>
                  </div>
                  {renderDetailedSection(section.content)}
                </div>
              );
              
            case 'reading':
              return (
                <div key={index} className="space-y-6">
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <BookMarked className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Reading Material</h2>
                  </div>
                  {renderReadingMaterial(section.content)}
                </div>
              );
              
            case 'sections':
              return (
                <div key={index} className="space-y-6">
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Bookmark className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Key Sections to Reference</h2>
                  </div>
                  {renderSections(section.content)}
                </div>
              );
              
            case 'recommendations':
              return (
                <div key={index} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-8 shadow-lg">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Zap className="h-32 w-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Settings className="h-6 w-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-red-900">Recommendations</h2>
                    </div>
                    <div className="space-y-4">
                      {section.content
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((line) => line.startsWith('-'))
                        .map((line, lineIndex) => (
                          <div key={lineIndex} className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-red-100">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                            <span className="text-gray-700 leading-relaxed">
                              {renderFormattedText(line.replace(/^- /, ''))}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
              
            case 'scorecard':
              return (
                <div key={index} className="space-y-8">
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Performance Scorecard</h2>
                  </div>
                  {renderScorecard(section.content)}
                </div>
              );
              
            case 'mentor':
              return (
                <div key={index} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 p-8 shadow-lg">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Heart className="h-32 w-32" />
                  </div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-indigo-900 mb-4">Mentor's Note</h2>
                      <div className="bg-white/60 border-l-4 border-indigo-400 p-6 rounded-r-lg">
                        <blockquote className="text-gray-700 italic leading-relaxed text-lg">
                          {renderFormattedText(section.content.replace(/^[">]\s*/, '').replace(/["<]$/, ''))}
                        </blockquote>
                      </div>
                    </div>
                  </div>
                </div>
              );
              
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default ScriptAnalysisDisplay;