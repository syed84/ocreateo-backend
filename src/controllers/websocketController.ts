import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../config/socket';
import { sendSuccess } from '../utils/responses';

class WebSocketController {
  async getConnectedClients(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const io = getIO();
      const sockets = await io.fetchSockets();
      
      const clients = sockets.map(socket => ({
        id: socket.id,
        rooms: Array.from(socket.rooms),
      }));

      sendSuccess(res, {
        totalClients: clients.length,
        clients,
      });
    } catch (error) {
      next(error);
    }
  }

  async testBroadcast(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const io = getIO();
      
      io.to('admins').emit('testBroadcast', {
        message: 'Test broadcast from admin',
        timestamp: new Date(),
      });

      sendSuccess(res, null, 'Test broadcast sent to admins');
    } catch (error) {
      next(error);
    }
  }
}

export default new WebSocketController();