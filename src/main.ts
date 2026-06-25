import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// Importa a classe Logger do NestJS para emitir logs no terminal
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Cria uma instância do Logger para a classe bootstrap
  const logger = new Logger('Bootstrap');

  // Inicializa a aplicação NestJS com o AppModule raiz
  const app = await NestFactory.create(AppModule);

  // Define a porta a partir das variáveis de ambiente (.env) ou assume a porta 3000
  const port = process.env.PORT ?? 3002;

  // Inicia o servidor HTTP na porta definida
  await app.listen(port);

  // Exibe um log descritivo informando que a aplicação iniciou com sucesso e qual porta está utilizando
  logger.log(`Aplicação NestJS inicializada com sucesso e escutando na porta ${port}`);
  // Exibe um log indicando a URL base da aplicação
  logger.log(`URL do servidor: http://localhost:${port}`);
}
bootstrap();

