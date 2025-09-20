import React from 'react';
import { CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TextQualityIndicatorProps {
  qualityScore: number;
  improvements: string[];
  originalLength: number;
  processedLength: number;
  showDetails?: boolean;
}

export function TextQualityIndicator({ 
  qualityScore, 
  improvements, 
  originalLength, 
  processedLength,
  showDetails = false 
}: TextQualityIndicatorProps) {
  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (score >= 0.6) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    if (score >= 0.4) return 'Poor';
    return 'Very Poor';
  };

  const qualityPercentage = Math.round(qualityScore * 100);
  const lengthChange = processedLength - originalLength;
  const lengthChangePercentage = originalLength > 0 ? Math.round((lengthChange / originalLength) * 100) : 0;

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${getQualityColor(qualityScore)}`}>
                {getQualityIcon(qualityScore)}
                <span className="text-sm font-medium">{qualityPercentage}%</span>
              </div>
              {improvements.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {improvements.length} enhancements
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">Text Quality: {getQualityLabel(qualityScore)}</p>
              {improvements.length > 0 && (
                <p className="text-muted-foreground mt-1">
                  {improvements.length} text improvements applied
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          Text Processing Report
        </CardTitle>
        <CardDescription>
          Quality assessment and improvements applied to the extracted text
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Text Quality Score</span>
            <div className={`flex items-center gap-1 ${getQualityColor(qualityScore)}`}>
              {getQualityIcon(qualityScore)}
              <span className="font-medium">{getQualityLabel(qualityScore)}</span>
              <span className="text-muted-foreground">({qualityPercentage}%)</span>
            </div>
          </div>
          <Progress value={qualityPercentage} className="h-2" />
        </div>

        {/* Text Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Original Length:</span>
            <p className="font-medium">{originalLength.toLocaleString()} chars</p>
          </div>
          <div>
            <span className="text-muted-foreground">Processed Length:</span>
            <p className="font-medium">
              {processedLength.toLocaleString()} chars
              {lengthChange !== 0 && (
                <span className={`ml-1 text-xs ${lengthChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({lengthChangePercentage > 0 ? '+' : ''}{lengthChangePercentage}%)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Improvements Applied */}
        {improvements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Processing Enhancements Applied</span>
            </div>
            <div className="space-y-1">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>{improvement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {improvements.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>No text enhancements were needed - text was already high quality</span>
          </div>
        )}

        {/* Quality Explanation */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <p className="text-muted-foreground">
            <strong>Quality factors:</strong> Word count, sentence structure, character variety, 
            formatting consistency, and absence of OCR artifacts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}