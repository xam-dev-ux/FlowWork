import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { FlowWorkMarket } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("FlowWorkMarket", function () {
  let flowWork: FlowWorkMarket;
  let mockUSDC: any;
  let owner: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let client: SignerWithAddress;
  let user: SignerWithAddress;

  const MIN_STAKE = ethers.parseUnits("10", 6); // 10 USDC
  const TASK_BOUNTY = ethers.parseUnits("50", 6); // 50 USDC

  beforeEach(async function () {
    [owner, agent1, agent2, client, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);

    const FlowWorkMarket = await ethers.getContractFactory("FlowWorkMarket");
    flowWork = await FlowWorkMarket.deploy(await mockUSDC.getAddress());

    await mockUSDC.mint(agent1.address, ethers.parseUnits("1000", 6));
    await mockUSDC.mint(agent2.address, ethers.parseUnits("1000", 6));
    await mockUSDC.mint(client.address, ethers.parseUnits("1000", 6));
    await mockUSDC.mint(user.address, ethers.parseUnits("1000", 6));
  });

  describe("Agent Registration", function () {
    it("Should register an agent with minimum stake", async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);

      await expect(
        flowWork.connect(agent1).registerAgent(
          "0x123...xmtp",
          "agent1.base.eth",
          "https://api.agent1.com",
          ["Copywriting", "Research"],
          MIN_STAKE
        )
      )
        .to.emit(flowWork, "AgentRegistered")
        .withArgs(agent1.address, "0x123...xmtp", "agent1.base.eth", MIN_STAKE, 0);

      const agent = await flowWork.getAgent(agent1.address);
      expect(agent.tier).to.equal(0); // Rookie
      expect(agent.stake).to.equal(MIN_STAKE);
      expect(agent.reputationScore).to.equal(0);
    });

    it("Should reject registration with insufficient stake", async function () {
      const lowStake = ethers.parseUnits("5", 6);
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), lowStake);

      await expect(
        flowWork.connect(agent1).registerAgent(
          "0x123...xmtp",
          "agent1.base.eth",
          "https://api.agent1.com",
          ["Copywriting"],
          lowStake
        )
      ).to.be.revertedWith("Insufficient stake");
    });

    it("Should allow adding more stake", async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );

      const additionalStake = ethers.parseUnits("10", 6);
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), additionalStake);
      await flowWork.connect(agent1).addStake(additionalStake);

      const agent = await flowWork.getAgent(agent1.address);
      expect(agent.stake).to.equal(MIN_STAKE + additionalStake);
    });
  });

  describe("Task Creation", function () {
    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );
    });

    it("Should create a task and lock USDC", async function () {
      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);

      const deadline = (await time.latest()) + 86400; // 1 day
      await expect(
        flowWork.connect(client).createTask(
          "Write a blog post about Web3",
          "Markdown file",
          0, // Copywriting
          deadline,
          TASK_BOUNTY,
          false,
          0
        )
      )
        .to.emit(flowWork, "TaskCreated")
        .withArgs(1, client.address, 0, TASK_BOUNTY, deadline, "Write a blog post about Web3", false, 0);

      const task = await flowWork.getTask(1);
      expect(task.bounty).to.equal(TASK_BOUNTY);
      expect(task.status).to.equal(0); // Open
    });

    it("Should create recurring task", async function () {
      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);

      const deadline = (await time.latest()) + 86400;
      const interval = 604800; // 1 week

      await flowWork.connect(client).createTask(
        "Weekly social media post",
        "Text + image",
        6, // SocialMedia
        deadline,
        TASK_BOUNTY,
        true,
        interval
      );

      const task = await flowWork.getTask(1);
      expect(task.isRecurring).to.be.true;
    });
  });

  describe("Bidding System", function () {
    let taskId: number;
    let deadline: number;

    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );

      await mockUSDC.connect(agent2).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent2).registerAgent(
        "0x456...xmtp",
        "agent2.base.eth",
        "https://api.agent2.com",
        ["Copywriting"],
        MIN_STAKE
      );

      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);
      deadline = (await time.latest()) + 86400;
      await flowWork.connect(client).createTask(
        "Write a blog post",
        "Markdown",
        0,
        deadline,
        TASK_BOUNTY,
        false,
        0
      );
      taskId = 1;
    });

    it("Should allow agent to submit bid", async function () {
      const bidPrice = ethers.parseUnits("40", 6);
      await expect(
        flowWork.connect(agent1).submitBid(
          taskId,
          bidPrice,
          "I can deliver excellent content",
          3600
        )
      )
        .to.emit(flowWork, "BidSubmitted")
        .withArgs(taskId, agent1.address, bidPrice, "I can deliver excellent content", 3600);

      const bids = await flowWork.getTaskBids(taskId);
      expect(bids.length).to.equal(1);
      expect(bids[0].agent).to.equal(agent1.address);
    });

    it("Should allow multiple bids up to max", async function () {
      for (let i = 0; i < 10; i++) {
        const signer = i === 0 ? agent1 : agent2;
        await flowWork.connect(signer).submitBid(
          taskId,
          ethers.parseUnits("40", 6),
          `Proposal ${i}`,
          3600
        );
      }

      const task = await flowWork.getTask(taskId);
      expect(task.bidCount).to.equal(10);
    });

    it("Should reject bid exceeding bounty", async function () {
      const highBid = ethers.parseUnits("100", 6);
      await expect(
        flowWork.connect(agent1).submitBid(taskId, highBid, "Proposal", 3600)
      ).to.be.revertedWith("Price exceeds bounty");
    });
  });

  describe("Agent Selection", function () {
    let taskId: number;

    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );

      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);
      const deadline = (await time.latest()) + 86400;
      await flowWork.connect(client).createTask(
        "Write a blog post",
        "Markdown",
        0,
        deadline,
        TASK_BOUNTY,
        false,
        0
      );
      taskId = 1;

      await flowWork.connect(agent1).submitBid(
        taskId,
        ethers.parseUnits("40", 6),
        "Great proposal",
        3600
      );
    });

    it("Should select agent and refund difference", async function () {
      const clientBalanceBefore = await mockUSDC.balanceOf(client.address);

      await expect(flowWork.connect(client).selectAgent(taskId, agent1.address))
        .to.emit(flowWork, "AgentAssigned")
        .withArgs(taskId, agent1.address, ethers.parseUnits("40", 6));

      const task = await flowWork.getTask(taskId);
      expect(task.assignedAgent).to.equal(agent1.address);
      expect(task.status).to.equal(1); // Assigned

      const refund = ethers.parseUnits("10", 6); // 50 - 40
      const clientBalanceAfter = await mockUSDC.balanceOf(client.address);
      expect(clientBalanceAfter - clientBalanceBefore).to.equal(refund);
    });

    it("Should reject selection by non-client", async function () {
      await expect(
        flowWork.connect(user).selectAgent(taskId, agent1.address)
      ).to.be.revertedWith("Not task owner");
    });
  });

  describe("Delivery and Approval", function () {
    let taskId: number;

    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );

      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);
      const deadline = (await time.latest()) + 86400;
      await flowWork.connect(client).createTask(
        "Write a blog post",
        "Markdown",
        0,
        deadline,
        TASK_BOUNTY,
        false,
        0
      );
      taskId = 1;

      await flowWork.connect(agent1).submitBid(taskId, TASK_BOUNTY, "Proposal", 3600);
      await flowWork.connect(client).selectAgent(taskId, agent1.address);
    });

    it("Should submit delivery", async function () {
      await expect(
        flowWork.connect(agent1).submitDelivery(taskId, "QmXxxx...ipfshash")
      )
        .to.emit(flowWork, "TaskDelivered")
        .withArgs(taskId, agent1.address, "QmXxxx...ipfshash");

      const task = await flowWork.getTask(taskId);
      expect(task.status).to.equal(2); // Delivered
      expect(task.ipfsHash).to.equal("QmXxxx...ipfshash");
    });

    it("Should approve delivery and distribute funds", async function () {
      await flowWork.connect(agent1).submitDelivery(taskId, "QmXxxx...ipfshash");

      const agentBefore = await flowWork.getAgent(agent1.address);
      const protocolFeesBefore = await flowWork.protocolFees();

      await expect(flowWork.connect(client).approveDelivery(taskId))
        .to.emit(flowWork, "TaskApproved");

      const agentAfter = await flowWork.getAgent(agent1.address);
      const protocolFeesAfter = await flowWork.protocolFees();

      const expectedProtocolFee = (TASK_BOUNTY * 200n) / 10000n; // 2%
      const expectedReviewerFee = (TASK_BOUNTY * 100n) / 10000n; // 1%
      const expectedAgentPayment = TASK_BOUNTY - expectedProtocolFee - expectedReviewerFee;

      expect(agentAfter.pendingEarnings - agentBefore.pendingEarnings).to.equal(
        expectedAgentPayment
      );
      expect(protocolFeesAfter - protocolFeesBefore).to.equal(expectedProtocolFee);
      expect(agentAfter.completedTasks).to.equal(1);
      expect(agentAfter.reputationScore).to.equal(100);
    });

    it("Should award normal reputation for on-time delivery", async function () {
      await flowWork.connect(agent1).submitDelivery(taskId, "QmXxxx...ipfshash");

      await flowWork.connect(client).approveDelivery(taskId);

      const agent = await flowWork.getAgent(agent1.address);
      expect(agent.reputationScore).to.equal(100); // Normal on-time delivery
    });
  });

  describe("Tier Upgrades", function () {
    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );
    });

    it("Should upgrade to Silver tier", async function () {
      for (let i = 0; i < 10; i++) {
        await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);
        const deadline = (await time.latest()) + 86400;
        await flowWork.connect(client).createTask(
          `Task ${i}`,
          "Markdown",
          0,
          deadline,
          TASK_BOUNTY,
          false,
          0
        );
        const taskId = i + 1;

        await flowWork.connect(agent1).submitBid(taskId, TASK_BOUNTY, "Proposal", 3600);
        await flowWork.connect(client).selectAgent(taskId, agent1.address);
        await flowWork.connect(agent1).submitDelivery(taskId, "QmXxxx");
        await flowWork.connect(client).approveDelivery(taskId);
      }

      const agent = await flowWork.getAgent(agent1.address);
      expect(agent.tier).to.equal(1); // Silver
      expect(agent.completedTasks).to.equal(10);
      expect(agent.reputationScore).to.be.gte(400);
    });
  });

  describe("Dispute System", function () {
    let taskId: number;

    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );

      await mockUSDC.connect(agent2).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent2).registerAgent(
        "0x456...xmtp",
        "agent2.base.eth",
        "https://api.agent2.com",
        ["Research"],
        MIN_STAKE
      );

      const thirdAgent = user;
      await mockUSDC.connect(thirdAgent).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(thirdAgent).registerAgent(
        "0x789...xmtp",
        "agent3.base.eth",
        "https://api.agent3.com",
        ["DataAnalysis"],
        MIN_STAKE
      );

      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);
      const deadline = (await time.latest()) + 86400;
      await flowWork.connect(client).createTask(
        "Write a blog post",
        "Markdown",
        0,
        deadline,
        TASK_BOUNTY,
        false,
        0
      );
      taskId = 1;

      await flowWork.connect(agent1).submitBid(taskId, TASK_BOUNTY, "Proposal", 3600);
      await flowWork.connect(client).selectAgent(taskId, agent1.address);
      await flowWork.connect(agent1).submitDelivery(taskId, "QmXxxx");
    });

    it("Should open dispute and select reviewers", async function () {
      await expect(
        flowWork.connect(client).openDispute(taskId, "Work quality is poor")
      ).to.emit(flowWork, "DisputeOpened");

      const task = await flowWork.getTask(taskId);
      expect(task.status).to.equal(4); // Disputed

      const dispute = await flowWork.getDispute(taskId);
      expect(dispute.reviewers.length).to.equal(3);
    });

    it("Should resolve dispute in favor of client", async function () {
      await flowWork.connect(client).openDispute(taskId, "Poor quality");

      const dispute = await flowWork.getDispute(taskId);
      const reviewer1 = dispute.reviewers[0];
      const reviewer2 = dispute.reviewers[1];

      await flowWork.connect(await ethers.getSigner(reviewer1)).voteOnDispute(taskId, true);
      await flowWork.connect(await ethers.getSigner(reviewer2)).voteOnDispute(taskId, true);

      const finalDispute = await flowWork.getDispute(taskId);
      expect(finalDispute.resolved).to.be.true;
      expect(finalDispute.votesForClient).to.equal(2);
    });
  });

  describe("Agent Slashing", function () {
    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );
    });

    it("Should slash agent stake", async function () {
      const agentBefore = await flowWork.getAgent(agent1.address);
      const stakeBefore = agentBefore.stake;

      await expect(
        flowWork.connect(owner).slashAgent(agent1.address, "Missed deadline")
      ).to.emit(flowWork, "AgentSlashed");

      const agentAfter = await flowWork.getAgent(agent1.address);
      const expectedSlash = (stakeBefore * 20n) / 100n;
      expect(stakeBefore - agentAfter.stake).to.equal(expectedSlash);
    });
  });

  describe("Earnings Withdrawal", function () {
    beforeEach(async function () {
      await mockUSDC.connect(agent1).approve(await flowWork.getAddress(), MIN_STAKE);
      await flowWork.connect(agent1).registerAgent(
        "0x123...xmtp",
        "agent1.base.eth",
        "https://api.agent1.com",
        ["Copywriting"],
        MIN_STAKE
      );

      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);
      const deadline = (await time.latest()) + 86400;
      await flowWork.connect(client).createTask(
        "Write a blog post",
        "Markdown",
        0,
        deadline,
        TASK_BOUNTY,
        false,
        0
      );

      await flowWork.connect(agent1).submitBid(1, TASK_BOUNTY, "Proposal", 3600);
      await flowWork.connect(client).selectAgent(1, agent1.address);
      await flowWork.connect(agent1).submitDelivery(1, "QmXxxx");
      await flowWork.connect(client).approveDelivery(1);
    });

    it("Should allow agent to withdraw earnings", async function () {
      const agent = await flowWork.getAgent(agent1.address);
      const pendingEarnings = agent.pendingEarnings;

      const balanceBefore = await mockUSDC.balanceOf(agent1.address);

      await expect(flowWork.connect(agent1).withdrawEarnings())
        .to.emit(flowWork, "EarningsWithdrawn")
        .withArgs(agent1.address, pendingEarnings);

      const balanceAfter = await mockUSDC.balanceOf(agent1.address);
      expect(balanceAfter - balanceBefore).to.equal(pendingEarnings);

      const agentAfter = await flowWork.getAgent(agent1.address);
      expect(agentAfter.pendingEarnings).to.equal(0);
    });
  });

  describe("Task Cancellation", function () {
    let taskId: number;

    beforeEach(async function () {
      await mockUSDC.connect(client).approve(await flowWork.getAddress(), TASK_BOUNTY);
      const deadline = (await time.latest()) + 86400;
      await flowWork.connect(client).createTask(
        "Write a blog post",
        "Markdown",
        0,
        deadline,
        TASK_BOUNTY,
        false,
        0
      );
      taskId = 1;
    });

    it("Should cancel task and refund client", async function () {
      const balanceBefore = await mockUSDC.balanceOf(client.address);

      await expect(flowWork.connect(client).cancelTask(taskId))
        .to.emit(flowWork, "TaskCancelled")
        .withArgs(taskId, client.address, TASK_BOUNTY);

      const balanceAfter = await mockUSDC.balanceOf(client.address);
      expect(balanceAfter - balanceBefore).to.equal(TASK_BOUNTY);

      const task = await flowWork.getTask(taskId);
      expect(task.status).to.equal(5); // Cancelled
    });
  });
});

// Mock ERC20 Contract for testing
import { Contract } from "ethers";

