import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum arquivo enviado' 
      }, { status: 400 });
    }
    
    // Criar nome único para o arquivo
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '_');
    const filename = `${timestamp}_${originalName}`;
    
    // Definir diretório de destino
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'produtos');
    
    // Criar diretório se não existir
    await mkdir(uploadDir, { recursive: true });
    
    // Converter o arquivo para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Caminho completo do arquivo de destino
    const filepath = path.join(uploadDir, filename);
    
    // Salvar o arquivo
    await writeFile(filepath, buffer);
    
    // Retornar o caminho relativo para acessar o arquivo
    return NextResponse.json({ 
      success: true, 
      url: `/uploads/produtos/${filename}` 
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}