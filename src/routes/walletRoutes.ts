import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateWithdrawalRequest } from '../middleware/validators';

const router = Router();

router.get('/me', authenticateToken, WalletController.getMyWallet);
router.post('/withdraw', authenticateToken, validateWithdrawalRequest, WalletController.requestWithdrawal);
router.get('/withdrawals', authenticateToken, WalletController.getMyWithdrawals);

export default router;