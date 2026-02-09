import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from './core/llm.service';
import { AgentRegistry } from './core/agent-registry';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { OrchestratorController } from './orchestrator/orchestrator.controller';
import { AgroAgent } from './agents/agro-agent.service';
import { FinanceAgent } from './agents/finance-agent.service';
import { StockAgent } from './agents/stock-agent.service';
import { HRAgent } from './agents/hr-agent.service';
import { SalesAgent } from './agents/sales-agent.service';
import { ComplianceAgentService } from './agents/compliance-agent.service';
import { WeatherAgent } from './agents/weather-agent.service';
import { DarijaAgent } from './agents/darija-agent.service';

@Module({
  imports: [ConfigModule],
  controllers: [OrchestratorController],
  providers: [
    LLMService,
    AgentRegistry,
    OrchestratorService,
    AgroAgent,
    FinanceAgent,
    StockAgent,
    HRAgent,
    SalesAgent,
    ComplianceAgentService,
    WeatherAgent,
    DarijaAgent,
  ],
  exports: [OrchestratorService, AgentRegistry],
})
export class AgentModule implements OnModuleInit {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly agroAgent: AgroAgent,
    private readonly financeAgent: FinanceAgent,
    private readonly stockAgent: StockAgent,
    private readonly hrAgent: HRAgent,
    private readonly salesAgent: SalesAgent,
    private readonly complianceAgent: ComplianceAgentService,
    private readonly weatherAgent: WeatherAgent,
    private readonly darijaAgent: DarijaAgent,
  ) {}

  onModuleInit() {
    this.registry.register(this.agroAgent);
    this.registry.register(this.financeAgent);
    this.registry.register(this.stockAgent);
    this.registry.register(this.hrAgent);
    this.registry.register(this.salesAgent);
    this.registry.register(this.complianceAgent);
    this.registry.register(this.weatherAgent);
    this.registry.register(this.darijaAgent);
  }
}
