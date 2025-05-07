// pages/api/cep.js
export default async function handler(req, res) {
    const { cep } = req.query;
    
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      return res.status(400).json({ error: 'CEP inválido' });
    }
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      
      if (response.ok && !data.erro) {
        return res.status(200).json(data);
      } else {
        return res.status(404).json({ error: 'CEP não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return res.status(500).json({ error: 'Erro ao buscar CEP' });
    }
  }