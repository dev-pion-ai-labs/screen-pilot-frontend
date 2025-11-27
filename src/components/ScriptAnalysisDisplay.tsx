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
  Sparkles,
  ExternalLink,
  List,
  Hash,
  Quote
} from 'lucide-react';

const ScriptAnalysisDisplay = ({ analysisResult, type }) => {

  console.log("analysisResult", analysisResult)
  // Clean source citations from text
  const cleanText = (text) => {
    return text.replace(/【\d+:\d+†source】/g, '').trim();
  };



  // Check if content follows the structured AI format
  const isStructuredFormat = (content) => {
    const structuredMarkers = [
      '📘 Script Title:',
      '🎯 Submitted Idea:',
      '🧠 OVERALL',
      '🔍 DETAILED EVALUATION:',
      '📚 READING MATERIAL',
      '🔖 SECTIONS TO REFER',
      '🛠️',
      '📊 SCORECARD',
      '🎓 MENTOR'
    ];
    return structuredMarkers.some(marker => content.includes(marker));
  };

  // Render general markdown content (for custom teacher edits)
  const renderGeneralMarkdown = (content) => {
    const cleanedContent = cleanText(content);
    const lines = cleanedContent.split('\n');
    const elements = [];
    let currentList = null;
    let currentListItems = [];
    let currentParagraph = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLanguage = '';

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push({
          type: 'paragraph',
          content: currentParagraph.join(' ')
        });
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push({
          type: currentList,
          items: [...currentListItems]
        });
        currentListItems = [];
        currentList = null;
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push({
          type: 'codeBlock',
          language: codeBlockLanguage,
          content: codeBlockContent.join('\n')
        });
        codeBlockContent = [];
        codeBlockLanguage = '';
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          flushCodeBlock();
        } else {
          flushParagraph();
          flushList();
          inCodeBlock = true;
          codeBlockLanguage = trimmedLine.replace('```', '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Empty line - flush current elements
      if (!trimmedLine) {
        flushParagraph();
        flushList();
        continue;
      }

      // Headers (# ## ###)
      if (trimmedLine.match(/^#{1,6}\s/)) {
        flushParagraph();
        flushList();
        const level = trimmedLine.match(/^#+/)[0].length;
        const headerText = trimmedLine.replace(/^#+\s*/, '');
        elements.push({
          type: 'header',
          level,
          content: headerText
        });
        continue;
      }

      // Horizontal rule
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        flushParagraph();
        flushList();
        elements.push({ type: 'hr' });
        continue;
      }

      // Blockquote
      if (trimmedLine.startsWith('>')) {
        flushParagraph();
        flushList();
        elements.push({
          type: 'blockquote',
          content: trimmedLine.replace(/^>\s*/, '')
        });
        continue;
      }

      // Unordered list
      if (trimmedLine.match(/^[-*+]\s/)) {
        flushParagraph();
        if (currentList !== 'ul') {
          flushList();
          currentList = 'ul';
        }
        currentListItems.push(trimmedLine.replace(/^[-*+]\s/, ''));
        continue;
      }

      // Ordered list
      if (trimmedLine.match(/^\d+\.\s/)) {
        flushParagraph();
        if (currentList !== 'ol') {
          flushList();
          currentList = 'ol';
        }
        currentListItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
        continue;
      }

      // Regular paragraph
      flushList();
      currentParagraph.push(trimmedLine);
    }

    // Flush remaining content
    flushParagraph();
    flushList();
    flushCodeBlock();

    return elements;
  };

  // Format inline markdown (bold, italic, links, code)
  const formatInlineMarkdown = (text) => {
    if (!text) return null;

    const parts = [];
    let currentIndex = 0;
    const cleanedText = cleanText(text);

    // Combined regex for all inline patterns
    const patterns = [
      { regex: /\*\*\*(.+?)\*\*\*/g, type: 'boldItalic' },
      { regex: /\*\*(.+?)\*\*/g, type: 'bold' },
      { regex: /\*(.+?)\*/g, type: 'italic' },
      { regex: /_(.+?)_/g, type: 'italic' },
      { regex: /`(.+?)`/g, type: 'code' },
      { regex: /\[(.+?)\]\((.+?)\)/g, type: 'link' },
      { regex: /(https?:\/\/[^\s]+)/g, type: 'autolink' }
    ];

    // Find all matches
    const allMatches = [];
    patterns.forEach(({ regex, type }) => {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      while ((match = regexCopy.exec(cleanedText)) !== null) {
        allMatches.push({
          type,
          start: match.index,
          end: match.index + match[0].length,
          full: match[0],
          content: match[1],
          url: match[2]
        });
      }
    });

    // Sort by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep first one)
    const filteredMatches = [];
    let lastEnd = -1;
    allMatches.forEach(match => {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    });

    // Build result
    let key = 0;
    filteredMatches.forEach(match => {
      // Add text before match
      if (match.start > currentIndex) {
        parts.push(
          <span key={key++}>{cleanedText.substring(currentIndex, match.start)}</span>
        );
      }

      // Add formatted content
      switch (match.type) {
        case 'boldItalic':
          parts.push(
            <strong key={key++} className="font-bold italic text-gray-900">{match.content}</strong>
          );
          break;
        case 'bold':
          parts.push(
            <strong key={key++} className="font-semibold text-gray-900">{match.content}</strong>
          );
          break;
        case 'italic':
          parts.push(
            <em key={key++} className="italic text-gray-700">{match.content}</em>
          );
          break;
        case 'code':
          parts.push(
            <code key={key++} className="px-1.5 py-0.5 bg-gray-100 text-pink-600 rounded text-sm font-mono">
              {match.content}
            </code>
          );
          break;
        case 'link':
          parts.push(
            <a
              key={key++}
              href={match.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              {match.content}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
          break;
        case 'autolink':
          parts.push(
            <a
              key={key++}
              href={match.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 break-all"
            >
              {match.content}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          );
          break;
      }

      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < cleanedText.length) {
      parts.push(
        <span key={key++}>{cleanedText.substring(currentIndex)}</span>
      );
    }

    return parts.length > 0 ? parts : cleanedText;
  };

  // Render general markdown elements with beautiful styling
  const renderMarkdownElements = (elements) => {
    return elements.map((element, index) => {
      switch (element.type) {
        case 'header':
          const headerClasses = {
            1: 'text-4xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200',
            2: 'text-3xl font-bold text-gray-900 mb-4',
            3: 'text-2xl font-semibold text-gray-800 mb-3',
            4: 'text-xl font-semibold text-gray-800 mb-2',
            5: 'text-lg font-semibold text-gray-700 mb-2',
            6: 'text-base font-semibold text-gray-700 mb-2'
          };
          return (
            <div key={index} className={`${headerClasses[element.level]} flex items-center gap-3`}>
              <Hash className="h-6 w-6 text-blue-500 flex-shrink-0" />
              <span>{formatInlineMarkdown(element.content)}</span>
            </div>
          );

        case 'paragraph':
          return (
            <p key={index} className="text-gray-700 leading-relaxed mb-4">
              {formatInlineMarkdown(element.content)}
            </p>
          );

        case 'ul':
          return (
            <ul key={index} className="space-y-2 mb-4 ml-6">
              {element.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{formatInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );

        case 'ol':
          return (
            <ol key={index} className="space-y-2 mb-4 ml-6 list-decimal list-inside">
              {element.items.map((item, i) => (
                <li key={i} className="text-gray-700">
                  {formatInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );

        case 'blockquote':
          return (
            <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
              <div className="flex items-start gap-3">
                <Quote className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                <p className="text-gray-700 italic">
                  {formatInlineMarkdown(element.content)}
                </p>
              </div>
            </div>
          );

        case 'codeBlock':
          return (
            <div key={index} className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
              {element.language && (
                <div className="text-xs text-gray-400 mb-2 font-mono">{element.language}</div>
              )}
              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                {element.content}
              </pre>
            </div>
          );

        case 'hr':
          return (
            <hr key={index} className="my-8 border-t-2 border-gray-200" />
          );

        default:
          return null;
      }
    });
  };

  // Parse markdown content into structured sections (ORIGINAL AI FORMAT)
  const parseMarkdown = (content) => {
    const cleanContent = cleanText(content);
    const sections = [];
    const lines = cleanContent.split('\n');
    let currentSection = null;
    let currentContent = [];
    let customSectionTitle = null;

    const flushSection = () => {
      if (currentSection && currentContent.length > 0) {
        sections.push({
          type: currentSection,
          content: currentContent.join('\n').trim(),
          customTitle: customSectionTitle
        });
        currentContent = [];
        customSectionTitle = null;
      }
    };

    for (let line of lines) {
      line = line.trim();
      
      if (line.startsWith('📘 Script Title:')) {
        flushSection();
        sections.push({
          type: 'title',
          content: line.replace('📘 Script Title:', '').trim()
        });
        currentSection = null;
      } else if (line.startsWith('🎯 Submitted Idea:')) {
        flushSection();
        sections.push({
          type: 'idea',
          content: line.replace('🎯 Submitted Idea:', '').trim()
        });
        currentSection = null;
      } else if (line.startsWith('🧠 OVERALL')) {
        flushSection();
        currentSection = 'overall';
        currentContent = [line.replace(/🧠 OVERALL.*?:/, '').trim()];
      } else if (line.startsWith('🔍 DETAILED EVALUATION:') || line.startsWith('🔍 ANALYSIS BREAKDOWN:')) {
        flushSection();
        currentSection = 'detailed';
        currentContent = [];
      } else if (line.startsWith('📚 READING MATERIAL')) {
        flushSection();
        currentSection = 'reading';
        currentContent = [];
      } else if (line.startsWith('🔖 SECTIONS TO REFER')) {
        flushSection();
        currentSection = 'sections';
        currentContent = [];
      } else if (line.startsWith('🛠️') && (line.includes('RECOMMENDATIONS') || line.includes('RECOMMENDATION'))) {
        flushSection();
        currentSection = 'recommendations';
        currentContent = [];
      } else if (line.startsWith('📊 SCORECARD')) {
        flushSection();
        currentSection = 'scorecard';
        currentContent = [];
      } else if (line.startsWith('🎓 MENTOR') || line.startsWith('🎓 Mentor') || line.startsWith('🎓 NOTE')) {
        flushSection();
        currentSection = 'mentor';
        currentContent = [line.replace(/🎓 (Mentor|MENTOR|NOTE).*?:/, '').trim()];
      } else if (line !== '---' && line !== '') {
        // Check if this line looks like a custom section header (ends with : and is short)
        if (line.endsWith(':') && line.length < 50 && !currentSection) {
          flushSection();
          currentSection = 'custom';
          customSectionTitle = line.replace(':', '').trim();
          currentContent = [];
        } else {
          // Add content to current section or create a custom section
          if (currentSection) {
            currentContent.push(line);
          } else if (line.trim() !== '') {
            // Start a new custom section for orphaned content
            currentSection = 'custom';
            customSectionTitle = 'Additional Notes';
            currentContent.push(line);
          }
        }
      }
    }

    flushSection();

    return sections;
  };

  const renderFormattedText = (text) => {
    return formatInlineMarkdown(text);
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scores.map((item, index) => {
            const [current, total] = item.score.split('/').map(Number);
            const percentage = (current / total) * 100;
            const isTotal = item.category.toLowerCase().includes('total');
            
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

  // Main render logic: choose between structured AI format or general markdown
  const isStructured = isStructuredFormat(analysisResult);

  if (isStructured) {
    // Render original AI structured format
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
                
              case 'custom':
                return (
                  <div key={index} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 p-8 shadow-lg">
                    <div className="absolute top-4 right-4 opacity-10">
                      <Info className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <Info className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-teal-900 mb-4">
                          {section.customTitle || 'Additional Notes'}
                        </h2>
                        <div className="text-gray-700 leading-relaxed space-y-3">
                          {section.content.split('\n').map((line, lineIndex) => (
                            line.trim() && (
                              <p key={lineIndex} className="text-gray-700">
                                {renderFormattedText(line)}
                              </p>
                            )
                          ))}
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
  } else {
    // Render general markdown format (for teacher-customized content)
    const elements = renderGeneralMarkdown(analysisResult);

    return (
      <div className="max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="prose prose-lg max-w-none">
          {type && (
            <div className="mb-8 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Script Analysis</p>
                <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-full font-medium">
                  {type}
                </span>
              </div>
            </div>
          )}
          {renderMarkdownElements(elements)}
        </div>
      </div>
    );
  }
};

export default ScriptAnalysisDisplay;