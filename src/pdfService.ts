import axios from 'axios';

interface PDFUploadResponse {
  docId: string;
}

interface ChatResponse {
  answer: {
    message: string;
  };
}

export class PDFService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.ASKYOURPDF_API_KEY || '';
    this.baseUrl = 'https://api.askyourpdf.com';
  }

  async uploadPDF(pdfBuffer: Buffer): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AskYourPDF API key is not configured');
    }

    try {
      const formData = new FormData();
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('file', blob, 'script.pdf');

      console.log('Attempting PDF upload with API key:', this.apiKey.substring(0, 10) + '...');
      console.log('Upload URL:', `${this.baseUrl}/v1/api/upload`);

      const response = await axios.post<PDFUploadResponse>(
        `${this.baseUrl}/v1/api/upload`,
        formData,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 60000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      console.log('Upload response status:', response.status);
      console.log('Upload response data:', JSON.stringify(response.data, null, 2));

      if (!response.data?.docId) {
        throw new Error('Invalid response structure: missing docId');
      }

      return response.data.docId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('PDF upload error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        throw new Error(`PDF upload failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getScriptContent(docId: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AskYourPDF API key is not configured');
    }

    try {
      console.log('Fetching script content for docId:', docId);

      const response = await axios.post<ChatResponse>(
        `${this.baseUrl}/v1/api/knowledge_base_chat`,
        {
          documents: [docId],
          messages: [{
            sender: "User",
            message: "Extract and format the entire script content as plain text, preserving line breaks and character dialogues."
          }],
          stream: false
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 60000
        }
      );

      console.log('Chat response status:', response.status);

      if (!response.data?.answer?.message) {
        throw new Error('Invalid response: missing script content');
      }

      return response.data.answer.message;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Script content error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        throw new Error(`Failed to get script content: ${error.message}`);
      }
      throw error;
    }
  }
}

export const pdfService = new PDFService();