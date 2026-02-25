import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export interface OTelConfig {
  serviceName: string;
  serviceVersion?: string;
  prometheusPort?: number;
}

export function bootstrapOpenTelemetry(config: OTelConfig): NodeSDK {
  const exporter = new PrometheusExporter({ 
    port: config.prometheusPort || 9464, 
    endpoint: '/metrics' 
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion || '1.0.0',
    }),
    metricReader: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}
