import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import type { QuestionAnswer, Standard, ChatSession, MCQ, Subject } from '../types';
import { CHAPTERS } from "../constants";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

if (!process.env.HF_API_KEY) {
    console.warn("HF_API_KEY environment variable not set. Image generation will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getAnswerPrompt = (topic: string, chapterName: string, standard: Standard, subject: Subject): string => {
  const basePrompt = `You are a friendly ${subject} tutor for ${standard} students in India.
For the chapter titled "${chapterName}", provide a simple and brief explanation for the topic: "${topic}".`;

  let instructions = `

CRITICAL INSTRUCTIONS:
- Explain the concept clearly in 2 to 3 short paragraphs.
- Keep the language simple and easy to understand.
- Ensure paragraphs have proper spacing between them.
- The entire response should be a single string.`;

  if (subject === 'Computer Science') {
    instructions += `
- For topics that are about programming syntax, data structures, or specific code, ALWAYS include a small, clear, and simple code example. Use Markdown for code blocks (e.g., \`\`\`python\n# your code here\n\`\`\`).
- For purely theoretical topics, do NOT include code examples.`;
  } else if (subject === 'Biology') {
    instructions += `
- Where appropriate, describe biological processes step-by-step.
- If the topic is about a structure (e.g., a cell, a flower), describe its key parts and their functions.
- Avoid code examples entirely.`;
  }
  
  return `${basePrompt}\n${instructions}`;
};

export async function getChapterTopics(chapterName: string, standard: Standard, subject: Subject, existingTopics: string[] = []): Promise<string[]> {
  const topicSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.STRING,
      description: "A single, concise, important question or topic from the chapter."
    }
  };
  let prompt = `You are a friendly ${subject} tutor for ${standard} students in India. For the chapter "${chapterName}", generate a list of 7 to 10 important and distinct questions that are strictly found within the NCERT syllabus for this chapter. The topics should be concise and phrased as questions.`;

  if (subject === 'Computer Science') {
     prompt += ` For chapters that involve programming concepts (like Python syntax, data structures, or algorithms), ensure a good mix of both theoretical questions and questions about specific code implementation or syntax. For example, for a chapter on 'Functions', you could include 'What is a function?' as well as 'How do you define a function in Python?'.`;
  }

  if (existingTopics.length > 0) {
    prompt += `\n\nAvoid generating questions similar to these already listed:\n- ${existingTopics.join('\n- ')}`;
  }
  
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: topicSchema,
        thinkingConfig: { thinkingBudget: 0 }, // Optimization: Faster for simple list generation
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error fetching chapter topics:", error);
    throw new Error(`Failed to get topics for "${chapterName}".`);
  }
}

export async function getTopicContent(topic: string, chapterName: string, standard: Standard, subject: Subject): Promise<string> {
  const answerSchema = {
    type: Type.OBJECT,
    properties: {
      answer: {
        type: Type.STRING,
        description: "A concise, 2-3 paragraph explanation of the topic, with markdown code blocks for programming topics.",
      },
    },
    required: ["answer"],
  };

  try {
    const prompt = getAnswerPrompt(topic, chapterName, standard, subject);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: answerSchema,
        },
    });
    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    return parsedData.answer;
  } catch(error) {
      console.error(`Error fetching content for topic "${topic}":`, error);
      throw new Error(`Failed to get content for topic: "${topic}".`);
  }
}

// Helper function to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // reader.result is "data:image/jpeg;base64,xxxxxxxx..."
                // we only want the base64 part: "xxxxxxxx..."
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as a Base64 string."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

export async function generateImageForTopic(topic: string, subject: Subject): Promise<string> {
    if (!process.env.HF_API_KEY) {
         throw new Error("Hugging Face API key is not configured. Cannot generate image.");
    }
    
    // Using Stable Diffusion XL as it's a powerful and fast open-source model.
    const HUGGING_FACE_MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

    try {
        // Enhanced prompt for better results with Stable Diffusion
        const prompt = subject === 'Biology'
            ? `A simple, clear, scientifically accurate educational diagram for the biology concept: "${topic}". Clean, modern textbook illustration style, minimal text, clear labels, vibrant colors, high quality, vector art.`
            : `A simple, clear, and visually appealing educational diagram for the computer science concept: "${topic}". Modern infographic style, helps understand the core idea, avoids complex code, vibrant colors, high quality, vector art.`;

        const response = await fetch(HUGGING_FACE_MODEL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
            }),
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Hugging Face API Error:", errorBody);
            // The HF API returns a 503 error when the model is loading, which can take some time on the first request.
            if (response.status === 503) {
                 throw new Error("The visualization model is currently loading. Please wait about 20 seconds and try again.");
            }
            throw new Error(`Failed to generate image. Status: ${response.status}.`);
        }

        const imageBlob = await response.blob();
        
        if (imageBlob.type.startsWith('image/')) {
            return await blobToBase64(imageBlob);
        } else {
             // Sometimes the API returns a JSON error payload even with a 200 OK status.
            const errorText = await imageBlob.text();
            console.error("Hugging Face API returned non-image data:", errorText);
            throw new Error("The model did not return a valid image. It may be under maintenance.");
        }

    } catch (error) {
        console.error("Error generating image with Hugging Face:", error);
        // Re-throw with a user-friendly message, preserving the original if it's informative.
        if (error instanceof Error && error.message) {
            throw new Error(error.message);
        }
        throw new Error("Failed to visualize the concept. Please try again.");
    }
}


export async function getMCQsForTopic(topic: string, subject: Subject): Promise<MCQ[]> {
    const mcqSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: {
                    type: Type.STRING,
                    description: "The multiple-choice question."
                },
                options: {
                    type: Type.ARRAY,
                    description: "An array of 4 strings representing the possible answers.",
                    items: { type: Type.STRING }
                },
                correctAnswer: {
                    type: Type.STRING,
                    description: "The correct answer, which must be one of the strings from the 'options' array."
                }
            },
            required: ["question", "options", "correctAnswer"]
        }
    };

    try {
        const prompt = `Based on the following ${subject} topic: "${topic}", generate exactly 4 distinct multiple-choice questions (MCQs) to test a student's understanding. Each question must have 4 options, and one of them must be the correct answer. Ensure the questions are relevant and cover key aspects of the topic.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: mcqSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error("Model returned an invalid or empty array for MCQs.");
        }

        return parsedData;

    } catch (error) {
        console.error(`Error generating MCQs for topic "${topic}":`, error);
        throw new Error(`Failed to generate a quiz for: "${topic}". Please try again.`);
    }
}

export function startChatSession(standard: Standard, subject: Subject, chapter?: string): ChatSession {
    let systemInstruction = `You are an expert ${subject} tutor for students in India, following the NCERT syllabus for "${standard}".`;

    if (chapter) {
        systemInstruction += ` The user is currently studying the chapter "${chapter}". Answer their questions clearly, concisely, and directly related to this chapter. Use simple language and code examples where helpful.`;
    } else {
        systemInstruction += ` The user has not selected a chapter yet. When answering their questions, you MUST mention which chapter the topic belongs to. For example, if they ask about 'sorting algorithms', you should start your response with something like, "Of course! Sorting algorithms are covered in the 'Sorting' chapter. Here's an explanation of Bubble Sort...". This helps the user know where to find the information.`;
    }

    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
}

export async function continueChatStream(chat: ChatSession, message: string) {
    try {
        return chat.sendMessageStream({ message });
    } catch (error) {
        console.error("Error starting chat stream:", error);
        throw new Error("Could not start a streaming chat session. Please try again.");
    }
}