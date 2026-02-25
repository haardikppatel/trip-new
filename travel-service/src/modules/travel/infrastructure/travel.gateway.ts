import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StructuredLogger } from '@tripaxis/core';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/travel-updates',
})
export class TravelGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly logger: StructuredLogger) {
    this.logger.setContext(TravelGateway.name);
  }

  handleConnection(client: Socket) {
    // In a real app, extract tenantId and userId from JWT token in client.handshake.auth
    const tenantId = client.handshake.auth.tenantId;
    if (tenantId) {
      client.join(`tenant_${tenantId}`);
      this.logger.log(`Client connected to tenant room: tenant_${tenantId}`);
    }
  }

  notifyTravelStatusUpdate(tenantId: string, travelRequestId: string, status: string) {
    this.server.to(`tenant_${tenantId}`).emit('travelStatusUpdated', {
      travelRequestId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}
