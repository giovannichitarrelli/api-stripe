import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createTodoController = async (
  request: Request,
  response: Response
) => {
  const userId = request.headers["x-user-id"];

  if (!userId) {
    return response.status(400).send({
      error: "Not authorized",
    });
  }

  const user = await prisma.user.findUnique({
    // verify upsert
    where: {
      id: userId as string,
    },
    select: {
      id: true,
      stripeSubscriptionId: true,
      stripeSubscriptionStatus: true,
      _count: {
        select: {
          todos: true,
        },
      },
    },
  });

  if (!user) {
    return response.status(400).send({
      error: "Not authorized",
    });
  }
  const hasQuotaAvailable = user._count.todos < 5; // verify upsert
  const hasActiveSubscription =
    !!user.stripeSubscriptionId // verify upsert

  console.log({
    hasActiveSubscription,
    hasQuotaAvailable,
  });
  if (!hasQuotaAvailable && !hasActiveSubscription &&  user.stripeSubscriptionStatus != "active") {
    // verify upsert
    return response.status(403).send({
      error: "not quota available. please, upgrade your plan.",
    });
  }

  const { title } = request.body;
  const todo = await prisma.todo.create({
    data: {
      title,
      userId: user.id,
    },
  });

  return response.status(201).send(todo);
};
