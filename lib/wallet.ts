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
  description: string
) {
  if (amount <= 0) {
    throw new Error("充值金额必须大于 0")
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount }
    })

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "TOPUP",
        amount,
        description
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
    const wallet = await tx.wallet.findUnique({ where: { userId } })

    if (!wallet || wallet.balance < amount) {
      throw new Error("余额不足")
    }

    const updated = await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    })

    await tx.transaction.create({
      data: {
        walletId: updated.id,
        userId,
        type: "DEDUCTION",
        amount: -amount,
        description,
        orderId
      }
    })

    return updated
  })
}
