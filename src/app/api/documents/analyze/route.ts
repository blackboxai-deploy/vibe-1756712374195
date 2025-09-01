// Document analysis endpoint using AI

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { DocumentAnalysisRequest, DocumentAnalysisResponse } from '@/types';

// Import documents store (in a real app, this would be a database)
let documentsStore: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: DocumentAnalysisRequest = await request.json();
    
    if (!body.documentId) {
      return NextResponse.json(
        { error: 'Document ID is required for analysis' },
        { status: 400 }
      );
    }

    // Find the document (in a real app, this would be a database lookup)
    const document = documentsStore.find(doc => doc.id === body.documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!document.content) {
      return NextResponse.json(
        { error: 'Document has no content to analyze' },
        { status: 400 }
      );
    }

    // Analyze document with AI
    const analysisOptions = {
      extractTasks: body.extractTasks || false,
      generateSummary: body.generateSummary || true,
      getInsights: body.getInsights || true
    };

    const analysisResult: DocumentAnalysisResponse = await aiClient.analyzeDocument(
      document.content,
      document.name,
      analysisOptions
    );

    // Update document with analysis results
    const updatedDocument = {
      ...document,
      summary: analysisResult.summary,
      insights: analysisResult.insights,
      extractedTasks: analysisResult.extractedTasks,
      analysisComplete: true
    };

    // Update in store
    const docIndex = documentsStore.findIndex(doc => doc.id === body.documentId);
    if (docIndex !== -1) {
      documentsStore[docIndex] = updatedDocument;
    }

    return NextResponse.json({
      analysis: analysisResult,
      document: updatedDocument,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = documentsStore.find(doc => doc.id === documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      documentId: document.id,
      name: document.name,
      analysisComplete: document.analysisComplete,
      summary: document.summary,
      insights: document.insights,
      extractedTasks: document.extractedTasks,
      lastAnalyzed: document.updatedAt
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get document analysis' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}