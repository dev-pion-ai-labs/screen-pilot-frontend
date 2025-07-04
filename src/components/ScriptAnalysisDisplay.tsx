import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    CheckCircle,
    AlertTriangle,
    Lightbulb,
    Target,
    Shield,
    FileText,
    Star,
    TrendingUp,
    Zap,
    BookOpen,
    Award,
    Users,
    MessageSquare,
    BarChart3,
    Brain,
    Book,
    Quote
} from 'lucide-react';

const ScriptAnalysisDisplay = ({ analysisResult }) => {
    // Helper function to safely parse JSON if it's a string
    const parseAnalysisData = (result) => {
        if (!result) return null;

        // If result has a 'raw' field, try to parse it as JSON (removing code block markers)
        if (result.raw) {
            try {
                const cleaned = result.raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                return JSON.parse(cleaned);
            } catch (e) {
                // If JSON parsing fails, return the raw text for markdown processing
                return { rawText: result.raw };
            }
        }

        // If it's already an object, return it
        if (typeof result === 'object' && result !== null) {
            return result;
        }

        // If it's a string, try to parse it as JSON first, then fall back to markdown
        if (typeof result === 'string') {
            try {
                const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                return JSON.parse(cleaned);
            } catch (e) {
                // If JSON parsing fails, return the raw text for markdown processing
                return { rawText: result };
            }
        }

        return null;
    };

    // Helper function to parse markdown-style text
    const parseMarkdownAnalysis = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        const result = {
            title: '',
            submittedIdea: '',
            overallVerdict: '',
            sections: [],
            scorecard: {},
            recommendations: [],
            mentorNote: ''
        };

        let currentSection = null;
        let currentContent = [];
        let isInScorecard = false;
        let isInRecommendations = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Extract title
            if (line.startsWith('📘 Script Title:') || line.startsWith('Script Title:')) {
                result.title = line.replace(/📘 Script Title:\s*"?([^"]*)"?/, '$1').replace(/Script Title:\s*/, '');
                continue;
            }

            // Extract submitted idea
            if (line.startsWith('🎯 Submitted Idea:') || line.startsWith('Submitted Idea:')) {
                result.submittedIdea = line.replace(/🎯 Submitted Idea:\s*/, '').replace(/Submitted Idea:\s*/, '');
                continue;
            }

            // Extract overall verdict/assessment
            if (line.startsWith('🧠 OVERALL VERDICT:') || line.startsWith('OVERALL ASSESSMENT:')) {
                let verdictText = '';
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine.startsWith('🔍') || nextLine.startsWith('---') || nextLine.startsWith('DETAILED EVALUATION:')) {
                        break;
                    }
                    if (nextLine) {
                        verdictText += nextLine + ' ';
                    }
                }
                result.overallVerdict = verdictText.trim();
                continue;
            }

            // Handle sections (numbered items)
            if (line.match(/^\d+\.\s*\*\*(.+?)\*\*/) || line.match(/^\d+\.\s*(.+?)$/)) {
                // Save previous section
                if (currentSection) {
                    currentSection.content = currentContent.join('\n').trim();
                    result.sections.push(currentSection);
                }

                // Start new section
                const sectionTitle = line.replace(/^\d+\.\s*\*\*(.+?)\*\*.*/, '$1').replace(/^\d+\.\s*(.+?)$/, '$1');
                currentSection = {
                    title: sectionTitle,
                    content: ''
                };
                currentContent = [];
                continue;
            }

            // Handle scorecard
            if (line.includes('📊 SCORECARD') || line.includes('SCORECARD')) {
                isInScorecard = true;
                continue;
            }

            if (isInScorecard && line.includes('|') && !line.includes('---')) {
                const parts = line.split('|').map(p => p.trim()).filter(p => p);
                if (parts.length >= 2) {
                    const category = parts[0];
                    const score = parts[1];
                    if (category && score && category !== 'Category' && score !== 'Score') {
                        result.scorecard[category] = score;
                    }
                }
                continue;
            }

            // Handle recommendations
            if (line.includes('🛠️') && line.includes('RECOMMENDATIONS') || line.includes('RECOMMENDATIONS:')) {
                isInRecommendations = true;
                isInScorecard = false;
                continue;
            }

            if (isInRecommendations && line.startsWith('-')) {
                result.recommendations.push(line.substring(1).trim());
                continue;
            }

            // Handle mentor's note
            if (line.includes('🎓') && line.includes('Mentor\'s Note') || line.includes('MENTOR\'S NOTE:')) {
                let mentorText = '';
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine.startsWith('>')) {
                        mentorText += nextLine.substring(1).trim() + ' ';
                    } else if (nextLine.startsWith('"') && nextLine.endsWith('"')) {
                        mentorText += nextLine.substring(1, nextLine.length - 1) + ' ';
                    }
                }
                result.mentorNote = mentorText.trim();
                continue;
            }

            // Add content to current section
            if (currentSection && line && !line.startsWith('---') && !isInScorecard && !isInRecommendations) {
                currentContent.push(line);
            }
        }

        // Don't forget the last section
        if (currentSection) {
            currentSection.content = currentContent.join('\n').trim();
            result.sections.push(currentSection);
        }

        return result;
    };

    const analysis = parseAnalysisData(analysisResult);
    
    if (!analysis) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No analysis data available</p>
                </CardContent>
            </Card>
        );
    }

    // Check if we have markdown-style text data
    const markdownData = analysis.rawText ? parseMarkdownAnalysis(analysis.rawText) : null;

    // Section configurations with icons and colors
    const sectionConfigs = {
        'Concept & Originality': {
            icon: Lightbulb,
            color: 'purple',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        'Structure & Pacing': {
            icon: BookOpen,
            color: 'blue',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        'Character Development': {
            icon: Users,
            color: 'green',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        'Characters': {
            icon: Users,
            color: 'green',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        'Dialogue Quality': {
            icon: MessageSquare,
            color: 'orange',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        'Dialogue & Language': {
            icon: MessageSquare,
            color: 'orange',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        'Dialogue': {
            icon: MessageSquare,
            color: 'orange',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        'Theme & Message': {
            icon: Target,
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200'
        },
        'Formatting & Professionalism': {
            icon: FileText,
            color: 'gray',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
        },
        'Formatting & Academic Standard': {
            icon: FileText,
            color: 'gray',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
        },
        'Market Readiness': {
            icon: TrendingUp,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200'
        },
        'Relevance & Contextual Application': {
            icon: Brain,
            color: 'teal',
            bgColor: 'bg-teal-50',
            borderColor: 'border-teal-200'
        },
        // Default fallback
        default: {
            icon: BookOpen,
            color: 'blue',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        }
    };

    const getSectionConfig = (title) => {
        return sectionConfigs[title] || sectionConfigs.default;
    };

    // Render markdown-style analysis
    if (markdownData) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star className="h-6 w-6 text-blue-600" />
                                <span className="text-xl text-blue-900">
                                    {markdownData.title || 'Script Analysis'}
                                </span>
                            </div>
                            <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                                AI Analysis Complete
                            </Badge>
                        </CardTitle>
                        {markdownData.submittedIdea && (
                            <p className="text-blue-700 mt-2 text-sm">
                                <strong>Submitted Idea:</strong> {markdownData.submittedIdea}
                            </p>
                        )}
                    </CardHeader>
                </Card>

                {/* Overall Verdict */}
                {markdownData.overallVerdict && (
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-700">
                                <Award className="h-5 w-5" />
                                Overall Assessment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-emerald-800 leading-relaxed">
                                {markdownData.overallVerdict}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Analysis Sections */}
                {markdownData.sections.map((section, index) => {
                    const config = getSectionConfig(section.title);
                    const IconComponent = config.icon;
                    
                    return (
                        <Card key={index} className={`${config.borderColor} ${config.bgColor}`}>
                            <CardHeader className="pb-3">
                                <CardTitle className={`flex items-center gap-2 text-${config.color}-700`}>
                                    <IconComponent className={`h-5 w-5 text-${config.color}-600`} />
                                    {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none">
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {section.content}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Scorecard */}
                {Object.keys(markdownData.scorecard).length > 0 && (
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-700">
                                <BarChart3 className="h-5 w-5" />
                                Scorecard
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(markdownData.scorecard).map(([category, score]) => (
                                    <div key={category} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                        <span className="font-medium text-gray-700">{category}</span>
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                            {score}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recommendations */}
                {markdownData.recommendations.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-700">
                                <Lightbulb className="h-5 w-5" />
                                Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {markdownData.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-orange-500 mt-1">💡</span>
                                        <span className="text-orange-800 text-sm">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Mentor's Note */}
                {markdownData.mentorNote && (
                    <Card className="border-violet-200 bg-violet-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-violet-700">
                                <Quote className="h-5 w-5" />
                                Mentor's Note
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <blockquote className="text-violet-800 leading-relaxed italic border-l-4 border-violet-300 pl-4">
                                {markdownData.mentorNote}
                            </blockquote>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // Original structured JSON rendering logic
    const { title, analysis: analysisData, conclusion, script_title } = analysis;
    const displayTitle = title || script_title || 'Script Analysis';

    const originalSectionConfigs = {
        structure_and_organization: {
            title: 'Structure & Organization',
            icon: BookOpen,
            color: 'blue',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        common_mistakes: {
            title: 'Common Mistakes',
            icon: AlertTriangle,
            color: 'red',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200'
        },
        best_practices: {
            title: 'Best Practices',
            icon: CheckCircle,
            color: 'green',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        performance_aspects: {
            title: 'Performance Aspects',
            icon: Zap,
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        },
        security_concerns: {
            title: 'Security & Ethics',
            icon: Shield,
            color: 'purple',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        }
    };

    const renderSection = (sectionKey, sectionData) => {
        const config = originalSectionConfigs[sectionKey];
        if (!config || !sectionData) return null;

        const IconComponent = config.icon;

        return (
            <Card key={sectionKey} className={`${config.borderColor} ${config.bgColor}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`flex items-center gap-2 text-${config.color}-700`}>
                        <IconComponent className={`h-5 w-5 text-${config.color}-600`} />
                        {config.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Main Assessment */}
                    {(sectionData.assessment || sectionData.evaluation) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                Assessment
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                                {sectionData.assessment || sectionData.evaluation}
                            </p>
                        </div>
                    )}

                    {/* Areas for Improvement */}
                    {(sectionData.areas_for_improvement && sectionData.areas_for_improvement.length > 0) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                Areas for Improvement
                            </h4>
                            <ul className="space-y-1">
                                {sectionData.areas_for_improvement.map((item, index) => (
                                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                                        <span className="text-orange-500 mt-1">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Common Mistakes / Issues Identified */}
                    {(sectionData.common_mistakes_identified || sectionData.performance_issues_identified || sectionData.concerns_identified) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                Issues Identified
                            </h4>
                            <ul className="space-y-1">
                                {(sectionData.common_mistakes_identified || sectionData.performance_issues_identified || sectionData.concerns_identified || []).map((item, index) => (
                                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                                        <span className="text-red-500 mt-1">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Potential Bottlenecks */}
                    {(sectionData.potential_bottlenecks && sectionData.potential_bottlenecks.length > 0) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                                <Zap className="h-4 w-4" />
                                Potential Bottlenecks
                            </h4>
                            <ul className="space-y-1">
                                {sectionData.potential_bottlenecks.map((item, index) => (
                                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                                        <span className="text-yellow-500 mt-1">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Suggestions */}
                    {(sectionData.suggestions && sectionData.suggestions.length > 0) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                                <Lightbulb className="h-4 w-4" />
                                Suggestions
                            </h4>
                            <ul className="space-y-1">
                                {sectionData.suggestions.map((item, index) => (
                                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">💡</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Star className="h-6 w-6 text-blue-600" />
                            <span className="text-xl text-blue-900">{displayTitle}</span>
                        </div>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                            AI Analysis Complete
                        </Badge>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Analysis Sections */}
            {analysisData && (
                <div className="grid gap-6">
                    {Object.entries(analysisData).map(([sectionKey, sectionData]) =>
                        renderSection(sectionKey, sectionData)
                    )}
                </div>
            )}

            {/* Conclusion */}
            {conclusion && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            Conclusion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-green-800 leading-relaxed font-medium">
                            {conclusion}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Dynamically render any other top-level fields */}
            {Object.entries(analysis)
                .filter(([key]) => key !== 'analysis' && key !== 'conclusion' && key !== 'title' && key !== 'script_title' && key !== 'rawText')
                .map(([key, value]) => {
                    if (Array.isArray(value)) {
                        const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return (
                            <Card key={key} className="border-blue-200 bg-blue-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-700">
                                        <BookOpen className="h-5 w-5" />
                                        {title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-6 space-y-1">
                                        {value.map((item, idx) => (
                                            <li key={idx} className="text-gray-800 text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        );
                    }
                    if (typeof value === 'string' || typeof value === 'number') {
                        const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return (
                            <Card key={key} className="border-gray-200 bg-gray-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-700">
                                        <Star className="h-5 w-5" />
                                        {title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-gray-800 text-sm">{value}</div>
                                </CardContent>
                            </Card>
                        );
                    }
                    return null;
                })}
        </div>
    );
};

export default ScriptAnalysisDisplay;