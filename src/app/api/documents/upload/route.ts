// Document upload and processing endpoint

import { NextRequest, NextResponse } from 'next/server';
import { Document } from '@/types';

// Simple in-memory document store for demo purposes
let documentsStore: Document[] = [];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const isSupported = supportedTypes.some(type => 
      file.type.toLowerCase().includes(type.split('/')[1])
    );

    if (!isSupported) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported: PDF, Word, Text, Markdown, CSV, JSON` },
        { status: 400 }
      );
    }

    // Extract text content
    let content = '';
    
    if (file.type.includes('text/') || file.type.includes('application/json')) {
      content = await file.text();
    } else {
      // For PDF and Word docs, we'll store metadata and process with AI later
      content = `[Binary File: ${file.name} - ${file.type} - ${file.size} bytes]`;
    }

    // Create document object
    const document: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      content,
      analysisComplete: false
    };

    // Store document
    documentsStore.push(document);

    return NextResponse.json({
      document,
      message: 'Document uploaded successfully',
      needsAnalysis: !file.type.includes('text/')
    }, { status: 201 });

  } catch (error) {
    console.error('Document upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      documents: documentsStore,
      total: documentsStore.length
    });
  } catch (error) {
    console.error('Get documents error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const documentIndex = documentsStore.findIndex(doc => doc.id === documentId);
    if (documentIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const deletedDocument = documentsStore.splice(documentIndex, 1)[0];

    return NextResponse.json({
      message: 'Document deleted successfully',
      deletedDocument
    });

  } catch (error) {
    console.error('Delete document error:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}