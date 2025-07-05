import React from 'react';
import { 
  FileText, 
  Target, 
  CheckSquare, 
  BarChart3, 
  BookOpen, 
  Calendar,
  Clock,
  Star,
  Award,
  Users,
  Download,
  Eye,
  Lightbulb,
  List,
  AlertCircle,
  Layers
} from 'lucide-react';

const AssignmentDisplay = ({ content }) => {
  // More comprehensive content parsing
  const parseContent = (content) => {
    const sections = {
      title: '',
      sections: [],
      rubric: [],
      knowledgeSource: '',
      totalMarks: 0
    };

    // Extract title (handle both formats)
    const titleMatch = content.match(/(?:📄\s*\*\*Title\*\*:\s*|Title.*?:\s*)(.*?)(?=\n|📝)/);
    if (titleMatch) {
      sections.title = titleMatch[1].trim();
    }

    // Split content into major sections
    const mainSections = content.split(/(?=📝\s*\*\*Assignment\*\*|📊\s*\*\*Rubric|📚\s*\*\*Knowledge Source|You can learn more)/);
    
    mainSections.forEach(section => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;

      // Handle Assignment section
      if (trimmedSection.includes('📝') || trimmedSection.includes('**Assignment**')) {
        const assignmentContent = trimmedSection.replace(/📝\s*\*\*Assignment\*\*:?\s*/, '');
        const subSections = parseAssignmentSection(assignmentContent);
        sections.sections.push(...subSections);
      }
      // Handle Rubric section
      else if (trimmedSection.includes('📊') || trimmedSection.includes('Rubric')) {
        const rubricData = parseRubricSection(trimmedSection);
        if (rubricData.rubric.length > 0) {
          sections.rubric = rubricData.rubric;
          sections.totalMarks = rubricData.totalMarks;
        }
      }
      // Handle Knowledge Source section
      else if (trimmedSection.includes('📚') || trimmedSection.includes('You can learn more')) {
        const knowledgeSource = parseKnowledgeSource(trimmedSection);
        if (knowledgeSource) {
          sections.knowledgeSource = knowledgeSource;
        }
      }
    });

    return sections;
  };

  const parseAssignmentSection = (content) => {
    const sections = [];
    
    // Split by common section headers
    const sectionHeaders = [
      'Objective', 'Task', 'Submission Format', 'Instructions', 
      'Requirements', 'Deliverables', 'Guidelines', 'Process',
      'Steps', 'Components', 'Parts', 'Phases'
    ];
    
    let currentSection = { type: 'general', title: 'Assignment Details', content: '' };
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a section header
      const headerMatch = line.match(/\*\*([^*]+)\*\*:\s*$/);
      if (headerMatch) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        
        // Start new section
        const headerTitle = headerMatch[1].trim();
        currentSection = {
          type: headerTitle.toLowerCase().replace(/\s+/g, '_'),
          title: headerTitle,
          content: ''
        };
      } else {
        // Add line to current section
        currentSection.content += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const parseRubricSection = (content) => {
    const result = { rubric: [], totalMarks: 0 };
    
    // Find table content
    const tableMatch = content.match(/\|([\s\S]*?)(?=📚|You can learn|$)/);
    if (tableMatch) {
      const tableContent = tableMatch[1];
      const rows = tableContent.split('\n').filter(row => row.includes('|') && !row.includes('---'));
      
      result.rubric = rows
  .map(row => {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
    if (
      cells.length >= 2 &&
      cells[0].toLowerCase() !== "criteria" && // <-- Add this line
      cells[1].toLowerCase() !== "weightage"
    ) {
      const weightage = parseInt(cells[1]) || 0;
      result.totalMarks += weightage;
      return {
        criteria: cells[0],
        weightage: weightage
      };
    }
    return null;
  })
  .filter(Boolean);

    }
    
    return result;
  };

  const parseKnowledgeSource = (content) => {
    const match = content.match(/(?:📚\s*\*\*Knowledge Source Used\*\*:|You can learn more using this knowledge source:)\s*\*?\*?([\s\S]*?)(?:\n\n|$)/);
    if (match) {
      return match[1].trim().replace(/\*\*/g, '').replace(/\*/g, '');
    }
    return '';
  };

  const formatText = (text) => {
    if (!text) return [];
    
    return text.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Handle numbered lists with sub-items
      if (line.match(/^\d+\.\s/)) {
        const content = line.replace(/^\d+\.\s/, '');
        const formattedContent = formatInlineText(content);
        return (
          <div key={index} className="ml-4 mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">{line.match(/^\d+\./)[0]}</span>
              <div className="flex-1">{formattedContent}</div>
            </div>
          </div>
        );
      }
      
      // Handle bullet points and sub-bullets
      if (line.match(/^[-•*]\s/)) {
        const content = line.replace(/^[-•*]\s/, '');
        const formattedContent = formatInlineText(content);
        return (
          <div key={index} className="ml-4 mb-2 flex items-start">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <div className="flex-1">{formattedContent}</div>
          </div>
        );
      }
      
      // Handle sub-bullet points (more indented)
      if (line.match(/^\s{2,}[-•*]\s/)) {
        const content = line.replace(/^\s*[-•*]\s/, '');
        const formattedContent = formatInlineText(content);
        return (
          <div key={index} className="ml-8 mb-1 flex items-start">
            <span className="text-gray-400 mr-2 mt-1">◦</span>
            <div className="flex-1">{formattedContent}</div>
          </div>
        );
      }
      
      // Regular paragraphs
      const formattedContent = formatInlineText(line);
      return (
        <p key={index} className="mb-2">{formattedContent}</p>
      );
    });
  };

  const formatInlineText = (text) => {
    // Handle bold text properly
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const getSectionIcon = (type) => {
    const iconMap = {
      'objective': Target,
      'task': CheckSquare,
      'submission_format': Download,
      'instructions': List,
      'requirements': AlertCircle,
      'deliverables': Layers,
      'guidelines': BookOpen,
      'process': Layers,
      'steps': List,
      'components': Layers,
      'parts': Layers,
      'phases': Calendar,
      'general': FileText
    };
    
    return iconMap[type] || FileText;
  };

  const getSectionColor = (type) => {
    const colorMap = {
      'objective': 'green',
      'task': 'blue',
      'submission_format': 'purple',
      'instructions': 'indigo',
      'requirements': 'red',
      'deliverables': 'orange',
      'guidelines': 'teal',
      'process': 'cyan',
      'steps': 'pink',
      'components': 'lime',
      'parts': 'amber',
      'phases': 'violet',
      'general': 'gray'
    };
    
    return colorMap[type] || 'gray';
  };

  const data = parseContent(content);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center mb-4">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1" />
            <span>Total Marks: {data.totalMarks}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Assignment</span>
          </div>
        </div>
      </div>

      {/* Dynamic Sections */}
      {data.sections.map((section, index) => {
        const IconComponent = getSectionIcon(section.type);
        const color = getSectionColor(section.type);
        
        return (
          <div key={index} className="mb-8">
            <div className="flex items-center mb-4">
              <IconComponent className={`h-6 w-6 text-${color}-600 mr-2`} />
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className={`bg-${color}-50 p-4 rounded-lg border-l-4 border-${color}-400`}>
              <div className="text-gray-700">{formatText(section.content)}</div>
            </div>
          </div>
        );
      })}

      {/* Rubric Section */}
      {data.rubric.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Evaluation Rubric</h2>
            <span className="ml-2 text-sm text-gray-600">({data.totalMarks} Total Marks)</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                      Criteria
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                      Weightage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rubric.map((item, index) => (
                    <tr key={index} className="hover:bg-white transition-colors">
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">
                        {item.criteria}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full font-semibold">
                          {item.weightage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Source */}
      {data.knowledgeSource && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <BookOpen className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Knowledge Source</h2>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
            <div className="flex items-center">
              <Lightbulb className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-gray-700 font-medium">{data.knowledgeSource}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 mt-8">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            <span>Assignment Details</span>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1" />
            <span>Professional Academic Format</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDisplay;