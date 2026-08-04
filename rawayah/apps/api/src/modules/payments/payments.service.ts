import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  plans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceCents: 'asc' } });
  }

  async createPlan(body: { code: string; nameAr: string; priceCents: number; periodDays: number }) {
    return this.prisma.plan.upsert({
      where: { code: body.code },
      update: { nameAr: body.nameAr, priceCents: body.priceCents, periodDays: body.periodDays },
      create: {
        code: body.code,
        nameAr: body.nameAr,
        priceCents: body.priceCents,
        periodDays: body.periodDays,
        features: {},
      },
    });
  }

  async subscribe(userId: string, planCode: string, provider: string) {
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) {
      return { ok: false, message: 'الخطة غير موجودة' };
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + plan.periodDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'active',
        startsAt: now,
        endsAt: end,
      },
    });

    await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        provider,
        status: 'created',
        amountCents: plan.priceCents,
        paidAt: new Date(),
      },
    });

    return { ok: true, subscriptionId: subscription.id };
  }

  mySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { startsAt: 'desc' },
    });
  }
}
