import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BookOpen, 
  Lightbulb, 
  Star, 
  Clock, 
  BarChart3,
  Search,
  Filter,
  Zap,
  Brain,
  FileText,
  Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { faqSystem, type FAQItem, type QuestionAnalytics } from '../utils/faqSystem';

interface DynamicFAQProps {
  onAskQuestion: (question: string) => void;
  hasDocuments: boolean;
  documentCount: number;
}

export function DynamicFAQ({ onAskQuestion, hasDocuments, documentCount }: DynamicFAQProps) {
  const [popularQuestions, setPopularQuestions] = useState<FAQItem[]>([]);
  const [trendingQuestions, setTrendingQuestions] = useState<FAQItem[]>([]);
  const [analytics, setAnalytics] = useState<QuestionAnalytics | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState<FAQItem[]>([]);

  useEffect(() => {
    loadFAQData();
  }, []);

  useEffect(() => {
    // Filter questions based on search and category
    let questions = popularQuestions;
    
    if (selectedCategory !== 'all') {
      questions = questions.filter(q => q.category === selectedCategory);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      questions = questions.filter(q => 
        q.question.toLowerCase().includes(searchLower) ||
        q.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredQuestions(questions);
  }, [popularQuestions, selectedCategory, searchTerm]);

  const loadFAQData = () => {
    setPopularQuestions(faqSystem.getPopularQuestions(12));
    setTrendingQuestions(faqSystem.getTrendingQuestions(6));
    setAnalytics(faqSystem.getAnalytics());
    setCategories(faqSystem.getCategories());
  };

  const handleQuestionClick = (question: string) => {
    faqSystem.trackQuestion(question);
    onAskQuestion(question);
    loadFAQData(); // Refresh data after tracking
  };

  const getQuickActionQuestions = () => [
    {
      icon: FileText,
      label: "Document Overview",
      question: "Give me a comprehensive overview of all uploaded documents",
      color: "text-blue-500"
    },
    {
      icon: Brain,
      label: "Key Insights",
      question: "What are the most important insights across all documents?",
      color: "text-purple-500"
    },
    {
      icon: TrendingUp,
      label: "ML Types",
      question: "What are the main types of machine learning methods discussed in the paper?",
      color: "text-green-500"
    },
    {
      icon: Users,
      label: "ML Applications",
      question: "What real-world applications of machine learning are highlighted in the paper?",
      color: "text-orange-500"
    }
  ];

  const getMLSampleQuestions = () => [
    {
      icon: Brain,
      question: "Difference between traditional programming and machine learning?",
      category: "Theory",
      description: "Learn the fundamental difference between traditional and ML approaches"
    },
    {
      icon: BarChart3,
      question: "What are the three key elements of every machine learning algorithm?",
      category: "Theory",
      description: "Understand representation, evaluation, and optimization"
    },
    {
      icon: Zap,
      question: "What are the main advantages of machine learning mentioned?",
      category: "Analysis",
      description: "Discover the benefits and capabilities of ML systems"
    },
    {
      icon: FileText,
      question: "Which programming languages are most used in machine learning according to the paper?",
      category: "Applications",
      description: "Explore the tools and languages for ML development"
    },
    {
      icon: BookOpen,
      question: "Summarize the document",
      category: "Summary",
      description: "Get a comprehensive overview of the ML research paper"
    }
  ];

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Summary': BookOpen,
      'Research Methods': Search,
      'Results': BarChart3,
      'Analysis': Brain,
      'Applications': Zap,
      'Theory': Lightbulb,
      'Data': FileText,
      'Context': Users,
      'Future Work': TrendingUp
    };
    return icons[category] || BookOpen;
  };

  if (!hasDocuments) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Upload Documents to Get Started</h3>
          <p className="text-sm text-muted-foreground">
            Once you upload your academic documents, I'll provide intelligent question suggestions 
            and answers to help accelerate your research.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Analysis ({documentCount} documents)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {getQuickActionQuestions().map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => handleQuestionClick(action.question)}
                >
                  <Icon className={`h-4 w-4 mr-2 ${action.color}`} />
                  <div>
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.question}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Intelligent Question Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="samples" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="samples" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                ML Samples
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="samples" className="mt-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-3">
                  Try these sample questions about machine learning concepts:
                </div>
                {getMLSampleQuestions().map((sample, index) => {
                  const Icon = sample.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left w-full"
                      onClick={() => handleQuestionClick(sample.question)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{sample.question}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {sample.category}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {sample.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="mt-4">
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Questions Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {filteredQuestions.map((faq) => {
                    const CategoryIcon = getCategoryIcon(faq.category);
                    return (
                      <Button
                        key={faq.id}
                        variant="outline"
                        className="justify-start h-auto p-3 text-left"
                        onClick={() => handleQuestionClick(faq.question)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <CategoryIcon className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{faq.question}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {faq.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3" />
                                {faq.timesAsked}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trending" className="mt-4">
              <div className="space-y-2">
                {trendingQuestions.length > 0 ? (
                  trendingQuestions.map((faq) => {
                    const CategoryIcon = getCategoryIcon(faq.category);
                    return (
                      <Button
                        key={faq.id}
                        variant="outline"
                        className="justify-start h-auto p-3 text-left w-full"
                        onClick={() => handleQuestionClick(faq.question)}
                      >
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{faq.question}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {faq.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {faq.lastAsked.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No trending questions yet. Start asking questions to see trends!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              {analytics && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{analytics.totalQuestions}</div>
                        <div className="text-sm text-muted-foreground">Total Questions</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{analytics.popularKeywords.length}</div>
                        <div className="text-sm text-muted-foreground">Popular Keywords</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{Object.keys(analytics.categoryDistribution).length}</div>
                        <div className="text-sm text-muted-foreground">Categories</div>
                      </CardContent>
                    </Card>
                  </div>

                  {analytics.popularKeywords.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Popular Keywords</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analytics.popularKeywords.slice(0, 15).map((keyword) => (
                            <Badge key={keyword.word} variant="secondary">
                              {keyword.word} ({keyword.count})
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {Object.keys(analytics.categoryDistribution).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Question Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(analytics.categoryDistribution)
                            .sort(([,a], [,b]) => b - a)
                            .map(([category, count]) => (
                              <div key={category} className="flex justify-between items-center">
                                <span className="text-sm">{category}</span>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}