// src/app/api/upload-image/route.js
import { writeFile, mkdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const fileName = formData.get('fileName');
    const productCode = formData.get('productCode');
    
    if (!file || !fileName) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido ou nome inválido' },
        { status: 400 }
      );
    }

    // Criar estrutura de pastas
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'armacoes');
    await mkdir(uploadDir, { recursive: true });
    
    // Caminho completo do arquivo
    const filePath = path.join(uploadDir, fileName);
    
    // Converter o arquivo para um buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Escrever o arquivo no disco
    await writeFile(filePath, buffer);
    
    // Registrar sucesso no console para depuração
    console.log(`Arquivo ${fileName} foi salvo com sucesso em ${filePath}`);
    
    return NextResponse.json({ 
      success: true, 
      filePath: `/images/armacoes/${fileName}` 
    });
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json(
      { error: 'Falha ao salvar a imagem', details: error.message },
      { status: 500 }
    );
  }
}