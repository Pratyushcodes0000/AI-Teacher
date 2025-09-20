import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare form data for PDFRest API
    const pdfRestFormData = new FormData()
    pdfRestFormData.append('file', file)
    pdfRestFormData.append('full_text', 'document')

    // Call PDFRest API
    const pdfRestResponse = await fetch('https://api.pdfrest.com/extracted-text', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': 'f23a4753-5705-44d8-bcc3-f4e9cfacdbb9',
      },
      body: pdfRestFormData,
    })

    if (!pdfRestResponse.ok) {
      throw new Error(`PDFRest API error: ${pdfRestResponse.status} ${pdfRestResponse.statusText}`)
    }

    const result = await pdfRestResponse.json()
    
    // Extract text from response
    let extractedText = ''
    if (result.result?.fullText) {
      extractedText = result.result.fullText
    } else if (result.result?.pages) {
      extractedText = result.result.pages
        .map((page: any) => page.text)
        .join('\n\n')
    }

    // Generate summary from extracted text
    const summary = generateSummary(extractedText, file.name)

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        summary,
        fileName: file.name,
        fileSize: file.size
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in PDF extraction:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateSummary(text: string, fileName: string): string {
  if (!text || text.trim().length === 0) {
    return `**📄 Summary of ${fileName}:**\n\nNo text could be extracted from this PDF. The file may be image-based or password-protected.`
  }

  // Clean and prepare the text
  const cleanText = text.replace(/\s+/g, ' ').trim()
  const words = cleanText.split(' ')
  
  // If text is very short, return it as is
  if (words.length <= 100) {
    return `**📄 Summary of ${fileName}:**\n\n${cleanText}\n\n*Word count: ${words.length} words*`
  }

  // Extract key information
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10)
  
  // Score sentences based on importance indicators
  const scoredSentences = sentences.map(sentence => {
    let score = 0
    const lower = sentence.toLowerCase()
    
    // Higher scores for sentences with academic keywords
    const academicKeywords = [
      'research', 'study', 'analysis', 'findings', 'results', 'conclusion', 
      'methodology', 'data', 'evidence', 'significant', 'important', 
      'suggests', 'indicates', 'demonstrates', 'reveals', 'shows',
      'abstract', 'introduction', 'discussion', 'summary', 'overview'
    ]
    
    academicKeywords.forEach(keyword => {
      if (lower.includes(keyword)) score += 2
    })
    
    // Boost for sentences at the beginning (likely to be key points)
    if (sentences.indexOf(sentence) < sentences.length * 0.2) score += 3
    
    // Boost for sentences with numbers/statistics
    if (/\d+/.test(sentence)) score += 1
    
    // Penalty for very long sentences (often less clear)
    if (sentence.split(' ').length > 30) score -= 1
    
    // Boost for sentences with capital words (proper nouns, important terms)
    const capitalWords = sentence.match(/[A-Z][a-z]+/g) || []
    score += Math.min(capitalWords.length * 0.5, 3)
    
    return { sentence: sentence.trim(), score }
  })
  
  // Sort by score and take top sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(8, Math.ceil(sentences.length * 0.3)))
    .map(item => item.sentence)
    .filter(s => s.length > 20) // Filter out very short sentences
  
  // Create structured summary
  let summary = `**📄 Summary of ${fileName}:**\n\n`
  
  // Try to identify and extract key sections
  const firstSentence = topSentences[0] || sentences[0]
  if (firstSentence) {
    summary += `**Overview:** ${firstSentence}\n\n`
  }
  
  // Add key points
  if (topSentences.length > 1) {
    summary += `**Key Points:**\n`
    topSentences.slice(1, 6).forEach((sentence, index) => {
      summary += `${index + 1}. ${sentence}\n`
    })
    summary += '\n'
  }
  
  // Add document stats
  const wordCount = words.length
  const estimatedPages = Math.ceil(wordCount / 250) // Rough estimate
  
  summary += `**Document Info:**\n`
  summary += `• Word count: ~${wordCount.toLocaleString()} words\n`
  summary += `• Estimated pages: ~${estimatedPages}\n`
  summary += `• Text extracted successfully ✅\n\n`
  
  summary += `*Ready to answer your questions! Ask me anything about this document.*`
  
  return summary
}