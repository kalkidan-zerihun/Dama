/**
 * 🤖 AI ENGINE MODULE (MINIMAX & ALPHA-BETA PRUNING)
 * Evaluates board positions, forces captures, applies search depth by difficulty.
 * Loaded dynamically on-demand when user launches VS CPU match.
 */

export interface Move {
    fromR: number;
    fromC: number;
    toR: number;
    toC: number;
    isJump: boolean;
    capturedPiece?: { r: number; c: number };
}

export class AIEngine {
    static getBestMove(board: number[][], turn: number, difficulty: 'easy' | 'medium' | 'hard', rule: string): Move | null {
        const depthMap = { easy: 1, medium: 3, hard: 5 };
        const maxDepth = depthMap[difficulty] || 3;

        const legalMoves = this.getAllLegalMoves(board, turn, rule);
        if (legalMoves.length === 0) return null;

        // Forced captures if mandatory capture rule applies
        const jumpMoves = legalMoves.filter(m => m.isJump);
        const candidates = jumpMoves.length > 0 ? jumpMoves : legalMoves;

        if (candidates.length === 1 || maxDepth === 1) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        let bestScore = -Infinity;
        let bestMove: Move | null = null;

        for (const move of candidates) {
            const nextBoard = this.applyMoveToBoard(board, move);
            const score = this.minimax(nextBoard, maxDepth - 1, -Infinity, Infinity, false, turn, rule);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || candidates[0];
    }

    private static minimax(board: number[][], depth: number, alpha: number, beta: number, isMaximizing: boolean, aiTurn: number, rule: string): number {
        if (depth === 0) return this.evaluateBoard(board, aiTurn);

        const currentTurn = isMaximizing ? aiTurn : -aiTurn;
        const legalMoves = this.getAllLegalMoves(board, currentTurn, rule);

        if (legalMoves.length === 0) {
            return isMaximizing ? -10000 : 10000;
        }

        const jumpMoves = legalMoves.filter(m => m.isJump);
        const candidates = jumpMoves.length > 0 ? jumpMoves : legalMoves;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of candidates) {
                const nextBoard = this.applyMoveToBoard(board, move);
                const evalScore = this.minimax(nextBoard, depth - 1, alpha, beta, false, aiTurn, rule);
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of candidates) {
                const nextBoard = this.applyMoveToBoard(board, move);
                const evalScore = this.minimax(nextBoard, depth - 1, alpha, beta, true, aiTurn, rule);
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    private static evaluateBoard(board: number[][], aiTurn: number): number {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const val = board[r][c];
                if (val === 0) continue;

                const isAi = Math.sign(val) === aiTurn;
                const isKing = Math.abs(val) === 2;
                const pieceVal = isKing ? 30 : 10;
                
                // Positional advantage (center control and forward progress)
                const centerBonus = (c >= 2 && c <= 5) ? 2 : 0;
                const rowBonus = isAi ? (aiTurn === -1 ? r : 7 - r) : (aiTurn === -1 ? 7 - r : r);

                const totalVal = pieceVal + centerBonus + rowBonus;
                score += isAi ? totalVal : -totalVal;
            }
        }
        return score;
    }

    static getAllLegalMoves(board: number[][], turn: number, rule: string): Move[] {
        const moves: Move[] = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (Math.sign(board[r][c]) === turn) {
                    moves.push(...this.getPieceLegalMoves(board, r, c, turn, rule));
                }
            }
        }
        return moves;
    }

    private static getPieceLegalMoves(board: number[][], r: number, c: number, turn: number, rule: string): Move[] {
        const moves: Move[] = [];
        const isKing = Math.abs(board[r][c]) === 2;
        const forwardDir = turn === 1 ? -1 : 1;

        // Normal moves & jumps
        const dirs = isKing
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : [[forwardDir, -1], [forwardDir, 1]];

        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                if (board[nr][nc] === 0) {
                    moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, isJump: false });
                } else if (Math.sign(board[nr][nc]) === -turn) {
                    const lR = nr + dr;
                    const lC = nc + dc;
                    if (lR >= 0 && lR < 8 && lC >= 0 && lC < 8 && board[lR][lC] === 0) {
                        moves.push({
                            fromR: r, fromC: c, toR: lR, toC: lC, isJump: true,
                            capturedPiece: { r: nr, c: nc }
                        });
                    }
                }
            }
        }
        return moves;
    }

    private static applyMoveToBoard(board: number[][], move: Move): number[][] {
        const newBoard = board.map(row => [...row]);
        const piece = newBoard[move.fromR][move.fromC];
        newBoard[move.fromR][move.fromC] = 0;
        
        let finalPiece = piece;
        // King promotion on reach end
        if (piece === 1 && move.toR === 0) finalPiece = 2;
        if (piece === -1 && move.toR === 7) finalPiece = -2;

        newBoard[move.toR][move.toC] = finalPiece;

        if (move.isJump && move.capturedPiece) {
            newBoard[move.capturedPiece.r][move.capturedPiece.c] = 0;
        }

        return newBoard;
    }
}
