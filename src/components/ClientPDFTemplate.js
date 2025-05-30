// components/ClientPDFTemplate.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
    border: '3px solid #81059e',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#81059e',
    padding: 12,
    borderRadius: 6,
    color: 'white',
  },
  logo: {
    width: 35,
    height: 35,
    marginRight: 12,
    borderRadius: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#e9ecef',
  },
  clientInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderLeft: '4px solid #81059e',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 3,
  },
  clientId: {
    fontSize: 9,
    color: '#6c757d',
    marginBottom: 1,
  },
  section: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fdfdfe',
    borderRadius: 6,
    borderLeft: '3px solid #81059e',
    borderTop: '1px solid #e9ecef',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#81059e',
    marginBottom: 8,
    textTransform: 'uppercase',
    borderBottom: '1px solid #81059e',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  columnHalf: {
    width: '48%',
    marginRight: '4%',
  },
  columnThird: {
    width: '30%',
    marginRight: '5%',
  },
  columnTwoThirds: {
    width: '65%',
    marginRight: '5%',
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 10,
    color: '#212529',
    marginBottom: 4,
    minHeight: 12,
    wordWrap: 'break-word',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    borderTop: '2px solid #81059e',
  },
  declaration: {
    fontSize: 8,
    color: '#495057',
    textAlign: 'justify',
    lineHeight: 1.3,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkboxSquare: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#81059e',
    borderStyle: 'solid',
    marginRight: 6,
    marginTop: 1,
  },
  checkboxText: {
    fontSize: 8,
    color: '#495057',
    flex: 1,
    lineHeight: 1.2,
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  signatureBox: {
    width: '45%',
    borderBottom: '1px solid #212529',
    paddingBottom: 2,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#495057',
    textAlign: 'center',
  },
  dateBox: {
    width: '25%',
    borderBottom: '1px solid #212529',
    paddingBottom: 2,
    textAlign: 'center',
  },
  compactRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  threeColumn: {
    width: '32%',
    marginRight: '2%',
  },
  familySection: {
    backgroundColor: '#f1f3f4',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  familyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#81059e',
    marginBottom: 4,
  },
  familyItem: {
    fontSize: 8,
    color: '#495057',
    marginBottom: 2,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  contactColumn: {
    width: '32%',
    marginRight: '2%',
  },
});

// Componente do PDF
const ClientPDFTemplate = ({ client, titularData, dependentesData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          style={styles.logo}
          src="/images/otica_pop.png"
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>FICHA DE CADASTRO - Ótica Popular</Text>
          <Text style={styles.subtitle}>Sistema de Gestão Masi Oticas</Text>
        </View>
      </View>

      {/* Informações principais do cliente */}
      <View style={styles.clientInfo}>
        <View style={styles.clientDetails}>
          <Text style={styles.clientName}>{client.nome || 'Cliente'}</Text>
          <Text style={styles.clientId}>ID: {client.id} | CPF: {client.cpf || 'N/A'}</Text>
        </View>
      </View>

      {/* Dados Pessoais */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        
        <View style={styles.compactRow}>
          <View style={styles.columnTwoThirds}>
            <Text style={styles.label}>Nome Completo</Text>
            <Text style={styles.value}>{client.nome || 'N/A'}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Data Nascimento</Text>
            <Text style={styles.value}>
              {client.dataNascimento ? 
                (typeof client.dataNascimento === 'string' ? 
                  client.dataNascimento : 
                  new Date(client.dataNascimento.seconds * 1000).toLocaleDateString('pt-BR')
                ) : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.compactRow}>
          <View style={styles.threeColumn}>
            <Text style={styles.label}>Gênero</Text>
            <Text style={styles.value}>{client.genero || 'N/A'}</Text>
          </View>
          <View style={styles.threeColumn}>
            <Text style={styles.label}>Estado Civil</Text>
            <Text style={styles.value}>{client.estadoCivil || 'N/A'}</Text>
          </View>
          <View style={styles.threeColumn}>
            <Text style={styles.label}>Profissão</Text>
            <Text style={styles.value}>{client.profissao || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.compactRow}>
          <View style={styles.columnHalf}>
            <Text style={styles.label}>Escolaridade</Text>
            <Text style={styles.value}>{client.escolaridade || 'N/A'}</Text>
          </View>
          <View style={styles.columnHalf}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{client.email || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Contato */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações de Contato</Text>
        
        <View style={styles.contactRow}>
          <View style={styles.contactColumn}>
            <Text style={styles.label}>WhatsApp</Text>
            <Text style={styles.value}>{client.whatsapp || client.telefones?.[0] || 'N/A'}</Text>
          </View>
          <View style={styles.contactColumn}>
            <Text style={styles.label}>Telefone Alternativo</Text>
            <Text style={styles.value}>{client.telefoneAlternativo || client.telefones?.[1] || 'N/A'}</Text>
          </View>
          <View style={styles.contactColumn}>
            <Text style={styles.label}>Instagram</Text>
            <Text style={styles.value}>{client.instagram || 'N/A'}</Text>
          </View>
        </View>

        {client.contatoAlternativo && (
          <View style={styles.compactRow}>
            <View style={styles.threeColumn}>
              <Text style={styles.label}>Contato Alt. - Nome</Text>
              <Text style={styles.value}>{client.contatoAlternativo.nome || 'N/A'}</Text>
            </View>
            <View style={styles.threeColumn}>
              <Text style={styles.label}>Contato Alt. - Telefone</Text>
              <Text style={styles.value}>{client.contatoAlternativo.telefone || 'N/A'}</Text>
            </View>
            <View style={styles.threeColumn}>
              <Text style={styles.label}>Relação</Text>
              <Text style={styles.value}>{client.contatoAlternativo.relacao || 'N/A'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Endereço */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Endereço</Text>
        
        <View style={styles.compactRow}>
          <View style={styles.columnThird}>
            <Text style={styles.label}>CEP</Text>
            <Text style={styles.value}>{client.endereco?.cep || 'N/A'}</Text>
          </View>
          <View style={styles.columnTwoThirds}>
            <Text style={styles.label}>Logradouro</Text>
            <Text style={styles.value}>{client.endereco?.logradouro || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.compactRow}>
          <View style={styles.threeColumn}>
            <Text style={styles.label}>Número</Text>
            <Text style={styles.value}>{client.endereco?.numero || 'N/A'}</Text>
          </View>
          <View style={styles.threeColumn}>
            <Text style={styles.label}>Complemento</Text>
            <Text style={styles.value}>{client.endereco?.complemento || 'N/A'}</Text>
          </View>
          <View style={styles.threeColumn}>
            <Text style={styles.label}>Bairro</Text>
            <Text style={styles.value}>{client.endereco?.bairro || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.compactRow}>
          <View style={styles.columnHalf}>
            <Text style={styles.label}>Cidade</Text>
            <Text style={styles.value}>{client.endereco?.cidade || 'N/A'}</Text>
          </View>
          <View style={styles.columnHalf}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.value}>{client.endereco?.estado || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Relacionamentos Familiares */}
      {(titularData || dependentesData?.length > 0) && (
        <View style={styles.familySection}>
          <Text style={styles.familyTitle}>Relacionamentos Familiares</Text>
          
          {titularData && (
            <Text style={styles.familyItem}>
              Titular: {titularData.nome} - CPF: {titularData.cpf}
            </Text>
          )}
          
          {dependentesData?.length > 0 && (
            dependentesData.map((dep, index) => (
              <Text key={index} style={styles.familyItem}>
                Dependente: {dep.nome} - CPF: {dep.cpf} - Parentesco: {dep.parentesco || 'N/I'}
              </Text>
            ))
          )}
        </View>
      )}

      {/* Footer com declaração */}
      <View style={styles.footer}>
        <Text style={styles.declaration}>
          Declaro, sob as penas da lei, que as informações fornecidas neste cadastro são verdadeiras e de minha 
          inteira responsabilidade. Estou ciente de que a falsidade das declarações poderá implicar em sanções 
          civis e penais previstas na legislação vigente, conforme Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).
        </Text>
        
        <View style={styles.checkbox}>
          <View style={styles.checkboxSquare} />
          <Text style={styles.checkboxText}>
            Concordo com o uso dos meus dados pessoais para fins comerciais e legais da Ótica popular.
          </Text>
        </View>
        
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.value}></Text>
            <Text style={styles.signatureLabel}>Assinatura do Cliente</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.value}></Text>
            <Text style={styles.signatureLabel}>Data</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default ClientPDFTemplate;