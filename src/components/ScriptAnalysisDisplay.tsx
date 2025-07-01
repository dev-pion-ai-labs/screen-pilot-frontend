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
    BookOpen
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
                return null;
            }
        }

        // If it's already an object, return it
        if (typeof result === 'object' && result !== null) {
            return result;
        }

        // If it's a string, try to parse it
        if (typeof result === 'string') {
            try {
                const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                return JSON.parse(cleaned);
            } catch (e) {
                return null;
            }
        }

        return null;
    };

    const analysis = parseAnalysisData(analysisResult);

    console.log("ANALYSIS", analysis)

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

    const { title, analysis: analysisData, conclusion, script_title } = analysis;

    // Get the display title
    const displayTitle = title || script_title || 'Script Analysis';

    // Section configurations with icons and colors
    const sectionConfigs = {
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
        const config = sectionConfigs[sectionKey];
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

            {/* Dynamically render any other top-level fields (arrays, strings, etc.) */}
            {Object.entries(analysis)
                .filter(([key]) => key !== 'analysis' && key !== 'conclusion' && key !== 'title' && key !== 'script_title')
                .map(([key, value]) => {
                    // Render arrays as bulleted lists with a nice title
                    if (Array.isArray(value)) {
                        // Convert key to Title Case for display
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
                    // Render strings/numbers as a simple info card
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
                    // For objects, skip (already handled by 'analysis')
                    return null;
                })}

            {/* Raw Data Fallback (for debugging) */}
            {/* {process.env.NODE_ENV === 'development' && (
                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-600">Raw Analysis Data (Debug)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-32">
                            <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                {JSON.stringify(analysis, null, 2)}
                            </pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )} */}
        </div>
    );
};

export default ScriptAnalysisDisplay;