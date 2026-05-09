use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

// Devnet build (default). Same constants Veloran has used since the
// devnet program first deployed.
#[cfg(not(feature = "mainnet"))]
declare_id!("2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS");

#[cfg(not(feature = "mainnet"))]
/// Circle's official USDC mint on Solana devnet.
pub const USDC_MINT: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

#[cfg(not(feature = "mainnet"))]
/// Veloran treasury wallet — receives the 5% platform cut.
/// (Devnet: same as the deployer keypair for easy verification.)
pub const TREASURY: Pubkey = pubkey!("DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP");

// Mainnet build (anchor build -- --features mainnet). Constants set on
// 2026-05-09 for the Solana Frontier hackathon mainnet program.
#[cfg(feature = "mainnet")]
declare_id!("89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j");

#[cfg(feature = "mainnet")]
/// Circle's official USDC mint on Solana mainnet.
pub const USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

#[cfg(feature = "mainnet")]
/// Veloran treasury wallet on mainnet — receives the 5% platform cut.
/// Same keypair file is the program's upgrade authority; back up offline.
pub const TREASURY: Pubkey = pubkey!("8urcsZvfMnj8Rq3qo5Xk7PEDUQ7kS54cFTbPE6DxZsAD");

/// Platform fee in basis points: 500 = 5.00%.
pub const PLATFORM_BPS: u64 = 500;
pub const BPS_DENOMINATOR: u64 = 10_000;

#[program]
pub mod veloran_paywall {
    use super::*;

    /// Reader pays USDC for paywalled content. The amount is split
    /// 95% to the creator and 5% to the Veloran treasury, both routed
    /// via SPL transferChecked CPIs in a single atomic transaction.
    pub fn pay_for_content(ctx: Context<PayForContent>, amount: u64) -> Result<()> {
        require!(amount > 0, PaywallError::InvalidAmount);

        let platform_cut = amount
            .checked_mul(PLATFORM_BPS)
            .ok_or(PaywallError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(PaywallError::MathOverflow)?;
        let creator_cut = amount
            .checked_sub(platform_cut)
            .ok_or(PaywallError::MathOverflow)?;

        let decimals = ctx.accounts.mint.decimals;

        // 95% → creator
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.reader_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.creator_ata.to_account_info(),
                    authority: ctx.accounts.reader.to_account_info(),
                },
            ),
            creator_cut,
            decimals,
        )?;

        // 5% → platform treasury
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.reader_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.platform_ata.to_account_info(),
                    authority: ctx.accounts.reader.to_account_info(),
                },
            ),
            platform_cut,
            decimals,
        )?;

        emit!(PaymentSplit {
            reader: ctx.accounts.reader.key(),
            creator_ata: ctx.accounts.creator_ata.key(),
            amount,
            creator_cut,
            platform_cut,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct PayForContent<'info> {
    #[account(mut)]
    pub reader: Signer<'info>,

    #[account(
        mut,
        constraint = reader_ata.mint == USDC_MINT @ PaywallError::WrongMint,
        constraint = reader_ata.owner == reader.key() @ PaywallError::WrongOwner,
    )]
    pub reader_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = creator_ata.mint == USDC_MINT @ PaywallError::WrongMint,
    )]
    pub creator_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = platform_ata.mint == USDC_MINT @ PaywallError::WrongMint,
        constraint = platform_ata.owner == TREASURY @ PaywallError::WrongTreasury,
    )]
    pub platform_ata: Account<'info, TokenAccount>,

    #[account(constraint = mint.key() == USDC_MINT @ PaywallError::WrongMint)]
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct PaymentSplit {
    pub reader: Pubkey,
    pub creator_ata: Pubkey,
    pub amount: u64,
    pub creator_cut: u64,
    pub platform_cut: u64,
}

#[error_code]
pub enum PaywallError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Token account mint must be USDC")]
    WrongMint,
    #[msg("Reader does not own the source token account")]
    WrongOwner,
    #[msg("Platform ATA must be owned by the Veloran treasury")]
    WrongTreasury,
}
