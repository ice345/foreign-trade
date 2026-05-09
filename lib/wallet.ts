import { prisma } from "@/lib/prisma"

export async function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 }
  })
}

export async function topUpBalance(
  userId: string,
  amount: number,
  description: string,
  options?: {
    adminId?: string
    paymentRequestId?: string
    referenceNo?: string | null
  }
) {
  if (amount <= 0) {
    throw new Error("充值金额必须大于 0")
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.wallet.findUnique({ where: { userId } })
    const beforeBalance = existing ? Number(existing.balance) : 0
    const afterBalance = beforeBalance + amount

    const wallet = existing
      ? await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: amount } }
        })
      : await tx.wallet.create({
          data: { userId, balance: amount }
        })

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "TOPUP",
        amount,
        beforeBalance,
        afterBalance,
        description,
        paymentRequestId: options?.paymentRequestId,
        referenceNo: options?.referenceNo ?? undefined,
        adminId: options?.adminId
      }
    })

    return wallet
  })
}

export async function deductBalance(
  userId: string,
  amount: number,
  orderId: string,
  description: string
) {
  if (amount <= 0) {
    throw new Error("扣款金额必须大于 0")
  }

  return prisma.$transaction(async (tx) => {
    const currentWallet = await tx.wallet.findUnique({ where: { userId } })
    const beforeBalance = currentWallet ? Number(currentWallet.balance) : 0

    const result = await tx.wallet.updateMany({
      where: {
        userId,
        balance: { gte: amount }
      },
      data: { balance: { decrement: amount } }
    })

    if (result.count === 0) {
      throw new Error("余额不足")
    }

    const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } })
    const afterBalance = Number(wallet.balance)

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "DEDUCTION",
        amount: -amount,
        beforeBalance,
        afterBalance,
        description,
        orderId
      }
    })

    return wallet
  })
}
