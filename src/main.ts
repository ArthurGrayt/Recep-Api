import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// Importa a classe Logger do NestJS para emitir logs no terminal
import { Logger } from '@nestjs/common';
// Importa os módulos necessários para criar a documentação do Swagger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { urlencoded, json } from 'express';

async function bootstrap() {
  // Cria uma instância do Logger para a classe bootstrap
  const logger = new Logger('Bootstrap');

  // Inicializa a aplicação NestJS com o AppModule raiz
  const app = await NestFactory.create(AppModule);

  // Aumenta o limite de payload para permitir o envio de arquivos base64 (ex: ASO em PDF)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Habilita CORS para permitir que o Front-end (Next.js) acesse a API
  app.enableCors();

  // Configura as informações básicas da documentação Swagger
  const config = new DocumentBuilder()
    .setTitle('API Recep-Api')
    .setDescription('Documentação da API backend do projeto Gama Recep V2')
    .setVersion('1.0')
    // Adiciona o suporte a tokens Bearer na documentação (útil para autenticação)
    .addBearerAuth()
    .build();

  // Gera o documento Swagger com base nas configurações e nas rotas existentes
  const document = SwaggerModule.createDocument(app, config);
  
  // Monta a interface do Swagger no endpoint '/swagger'
  SwaggerModule.setup('swagger', app, document);

  // Define a porta a partir das variáveis de ambiente (.env) ou assume a porta 3000
  const port = process.env.PORT ?? 3002;

  // Inicia o servidor HTTP na porta definida
  await app.listen(port);

  // Exibe um log descritivo informando que a aplicação iniciou com sucesso e qual porta está utilizando
  logger.log(`Aplicação NestJS inicializada com sucesso e escutando na porta ${port}`);
  // Exibe um log indicando a URL base da aplicação
  logger.log(`URL do servidor: http://localhost:${port}`);
  // Exibe um log indicando a URL do Swagger
  logger.log(`Swagger UI disponível em: http://localhost:${port}/swagger`);
}
bootstrap();

