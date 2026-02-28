// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FlowWorkMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;

    uint256 public constant PROTOCOL_FEE_BPS = 200; // 2%
    uint256 public constant REVIEWER_FEE_BPS = 100; // 1%
    uint256 public constant MIN_AGENT_STAKE = 10_000_000; // 10 USDC (6 decimals)
    uint256 public constant SLASH_PERCENTAGE = 20; // 20% of stake
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_BIDS_PER_TASK = 10;

    uint256 public taskCounter;
    uint256 public protocolFees;
    uint256 public reviewerPool;

    enum AgentTier { Rookie, Silver, Gold, Elite }
    enum TaskStatus { Open, Assigned, Delivered, Approved, Disputed, Cancelled }
    enum TaskCategory {
        Copywriting,
        CodeReview,
        DataAnalysis,
        ImagePrompts,
        Research,
        Translation,
        SocialMedia,
        Financial,
        Legal,
        Other
    }

    struct Agent {
        address agentAddress;
        string xmtpAddress;
        string basename;
        string apiEndpoint;
        string[] specialties;
        uint256 stake;
        AgentTier tier;
        uint256 reputationScore;
        uint256 completedTasks;
        uint256 totalEarnings;
        uint256 pendingEarnings;
        bool isActive;
        uint256 registeredAt;
    }

    struct Task {
        uint256 taskId;
        address client;
        address assignedAgent;
        string description;
        string deliveryFormat;
        TaskCategory category;
        uint256 bounty;
        uint256 deadline;
        TaskStatus status;
        string ipfsHash;
        uint256 createdAt;
        uint256 bidCount;
        bool isRecurring;
        uint256 recurringInterval;
    }

    struct Bid {
        address agent;
        uint256 price;
        string proposal;
        uint256 estimatedTime;
        uint256 submittedAt;
    }

    struct Dispute {
        uint256 taskId;
        address initiator;
        string reason;
        address[] reviewers;
        mapping(address => bool) votes; // true = favor client, false = favor agent
        uint256 votesForClient;
        uint256 votesForAgent;
        bool resolved;
        uint256 createdAt;
    }

    mapping(address => Agent) public agents;
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Bid[]) public taskBids;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => bool) public isReviewer;

    address[] public registeredAgents;
    address[] public reviewerList;

    event AgentRegistered(
        address indexed agentAddress,
        string xmtpAddress,
        string basename,
        uint256 stake,
        AgentTier tier
    );

    event AgentTierUpgraded(
        address indexed agentAddress,
        AgentTier oldTier,
        AgentTier newTier,
        uint256 reputationScore
    );

    event TaskCreated(
        uint256 indexed taskId,
        address indexed client,
        TaskCategory category,
        uint256 bounty,
        uint256 deadline,
        string description,
        bool isRecurring,
        uint256 recurringInterval
    );

    event BidSubmitted(
        uint256 indexed taskId,
        address indexed agent,
        uint256 price,
        string proposal,
        uint256 estimatedTime
    );

    event AgentAssigned(
        uint256 indexed taskId,
        address indexed agent,
        uint256 price
    );

    event TaskDelivered(
        uint256 indexed taskId,
        address indexed agent,
        string ipfsHash
    );

    event TaskApproved(
        uint256 indexed taskId,
        address indexed client,
        address indexed agent,
        uint256 amount,
        uint256 protocolFee,
        uint256 reviewerFee
    );

    event TaskCancelled(
        uint256 indexed taskId,
        address indexed client,
        uint256 refundAmount
    );

    event DisputeOpened(
        uint256 indexed taskId,
        address indexed initiator,
        string reason,
        address[] reviewers
    );

    event DisputeVoted(
        uint256 indexed taskId,
        address indexed reviewer,
        bool favorClient
    );

    event DisputeResolved(
        uint256 indexed taskId,
        bool clientWon,
        uint256 votesForClient,
        uint256 votesForAgent
    );

    event AgentSlashed(
        address indexed agentAddress,
        uint256 slashedAmount,
        uint256 remainingStake,
        string reason
    );

    event EarningsWithdrawn(
        address indexed agent,
        uint256 amount
    );

    event ProtocolFeesWithdrawn(
        address indexed owner,
        uint256 amount
    );

    constructor(address _usdc) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
    }

    // ==================== AGENT REGISTRY ====================

    function registerAgent(
        string memory _xmtpAddress,
        string memory _basename,
        string memory _apiEndpoint,
        string[] memory _specialties,
        uint256 _stake
    ) external nonReentrant {
        require(_stake >= MIN_AGENT_STAKE, "Insufficient stake");
        require(!agents[msg.sender].isActive, "Already registered");
        require(bytes(_xmtpAddress).length > 0, "Invalid XMTP address");

        USDC.safeTransferFrom(msg.sender, address(this), _stake);

        Agent storage agent = agents[msg.sender];
        agent.agentAddress = msg.sender;
        agent.xmtpAddress = _xmtpAddress;
        agent.basename = _basename;
        agent.apiEndpoint = _apiEndpoint;
        agent.specialties = _specialties;
        agent.stake = _stake;
        agent.tier = AgentTier.Rookie;
        agent.reputationScore = 0;
        agent.completedTasks = 0;
        agent.totalEarnings = 0;
        agent.pendingEarnings = 0;
        agent.isActive = true;
        agent.registeredAt = block.timestamp;

        registeredAgents.push(msg.sender);

        emit AgentRegistered(
            msg.sender,
            _xmtpAddress,
            _basename,
            _stake,
            AgentTier.Rookie
        );
    }

    function addStake(uint256 _amount) external nonReentrant {
        require(agents[msg.sender].isActive, "Not registered");
        require(_amount > 0, "Invalid amount");

        USDC.safeTransferFrom(msg.sender, address(this), _amount);
        agents[msg.sender].stake += _amount;
    }

    function _updateAgentTier(address _agentAddress) internal {
        Agent storage agent = agents[_agentAddress];
        AgentTier oldTier = agent.tier;
        AgentTier newTier = oldTier;

        uint256 score = agent.reputationScore;
        uint256 completed = agent.completedTasks;

        if (score >= 800 && completed >= 50) {
            newTier = AgentTier.Elite;
        } else if (score >= 600 && completed >= 25) {
            newTier = AgentTier.Gold;
        } else if (score >= 400 && completed >= 10) {
            newTier = AgentTier.Silver;
        } else {
            newTier = AgentTier.Rookie;
        }

        if (newTier != oldTier) {
            agent.tier = newTier;
            emit AgentTierUpgraded(_agentAddress, oldTier, newTier, score);
        }
    }

    function slashAgent(address _agentAddress, string memory _reason) external onlyOwner {
        Agent storage agent = agents[_agentAddress];
        require(agent.isActive, "Agent not active");
        require(agent.stake > 0, "No stake to slash");

        uint256 slashAmount = (agent.stake * SLASH_PERCENTAGE) / 100;
        agent.stake -= slashAmount;

        emit AgentSlashed(_agentAddress, slashAmount, agent.stake, _reason);
    }

    function getAgentLeaderboard() external view returns (
        address[] memory addresses,
        uint256[] memory scores,
        AgentTier[] memory tiers,
        uint256[] memory completedTasks
    ) {
        uint256 agentCount = registeredAgents.length;
        addresses = new address[](agentCount);
        scores = new uint256[](agentCount);
        tiers = new AgentTier[](agentCount);
        completedTasks = new uint256[](agentCount);

        for (uint256 i = 0; i < agentCount; i++) {
            address agentAddr = registeredAgents[i];
            Agent storage agent = agents[agentAddr];
            addresses[i] = agentAddr;
            scores[i] = agent.reputationScore;
            tiers[i] = agent.tier;
            completedTasks[i] = agent.completedTasks;
        }

        return (addresses, scores, tiers, completedTasks);
    }

    // ==================== TASK ESCROW ====================

    function createTask(
        string memory _description,
        string memory _deliveryFormat,
        TaskCategory _category,
        uint256 _deadline,
        uint256 _bounty,
        bool _isRecurring,
        uint256 _recurringInterval
    ) external nonReentrant returns (uint256) {
        require(_bounty > 0, "Invalid bounty");
        require(_deadline > block.timestamp, "Invalid deadline");
        require(bytes(_description).length > 0, "Empty description");

        USDC.safeTransferFrom(msg.sender, address(this), _bounty);

        taskCounter++;
        Task storage task = tasks[taskCounter];
        task.taskId = taskCounter;
        task.client = msg.sender;
        task.description = _description;
        task.deliveryFormat = _deliveryFormat;
        task.category = _category;
        task.bounty = _bounty;
        task.deadline = _deadline;
        task.status = TaskStatus.Open;
        task.createdAt = block.timestamp;
        task.isRecurring = _isRecurring;
        task.recurringInterval = _recurringInterval;

        emit TaskCreated(
            taskCounter,
            msg.sender,
            _category,
            _bounty,
            _deadline,
            _description,
            _isRecurring,
            _recurringInterval
        );

        return taskCounter;
    }

    function submitBid(
        uint256 _taskId,
        uint256 _price,
        string memory _proposal,
        uint256 _estimatedTime
    ) external {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(agents[msg.sender].isActive, "Not registered agent");
        require(_price <= task.bounty, "Price exceeds bounty");
        require(task.bidCount < MAX_BIDS_PER_TASK, "Max bids reached");
        require(block.timestamp < task.deadline, "Task expired");

        Bid memory newBid = Bid({
            agent: msg.sender,
            price: _price,
            proposal: _proposal,
            estimatedTime: _estimatedTime,
            submittedAt: block.timestamp
        });

        taskBids[_taskId].push(newBid);
        task.bidCount++;

        emit BidSubmitted(_taskId, msg.sender, _price, _proposal, _estimatedTime);
    }

    function selectAgent(uint256 _taskId, address _agentAddress) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.client == msg.sender, "Not task owner");
        require(task.status == TaskStatus.Open, "Task not open");
        require(agents[_agentAddress].isActive, "Agent not active");

        bool bidFound = false;
        uint256 selectedPrice = 0;

        Bid[] storage bids = taskBids[_taskId];
        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].agent == _agentAddress) {
                bidFound = true;
                selectedPrice = bids[i].price;
                break;
            }
        }

        require(bidFound, "No bid from agent");

        task.assignedAgent = _agentAddress;
        task.status = TaskStatus.Assigned;

        if (selectedPrice < task.bounty) {
            uint256 refund = task.bounty - selectedPrice;
            task.bounty = selectedPrice;
            USDC.safeTransfer(msg.sender, refund);
        }

        emit AgentAssigned(_taskId, _agentAddress, selectedPrice);
    }

    function submitDelivery(uint256 _taskId, string memory _ipfsHash) external {
        Task storage task = tasks[_taskId];
        require(task.assignedAgent == msg.sender, "Not assigned agent");
        require(task.status == TaskStatus.Assigned, "Task not assigned");
        require(bytes(_ipfsHash).length > 0, "Empty IPFS hash");

        task.ipfsHash = _ipfsHash;
        task.status = TaskStatus.Delivered;

        emit TaskDelivered(_taskId, msg.sender, _ipfsHash);
    }

    function approveDelivery(uint256 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.client == msg.sender, "Not task owner");
        require(task.status == TaskStatus.Delivered, "Not delivered");

        address agent = task.assignedAgent;
        uint256 bounty = task.bounty;

        uint256 protocolFee = (bounty * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 reviewerFee = (bounty * REVIEWER_FEE_BPS) / BPS_DENOMINATOR;
        uint256 agentPayment = bounty - protocolFee - reviewerFee;

        protocolFees += protocolFee;
        reviewerPool += reviewerFee;

        agents[agent].pendingEarnings += agentPayment;
        agents[agent].totalEarnings += agentPayment;
        agents[agent].completedTasks++;

        bool earlyDelivery = block.timestamp < task.deadline - 1 days;
        uint256 reputationGain = earlyDelivery ? 120 : 100;

        agents[agent].reputationScore += reputationGain;
        if (agents[agent].reputationScore > 1000) {
            agents[agent].reputationScore = 1000;
        }

        _updateAgentTier(agent);

        task.status = TaskStatus.Approved;

        emit TaskApproved(_taskId, msg.sender, agent, agentPayment, protocolFee, reviewerFee);

        if (task.isRecurring && task.recurringInterval > 0) {
            _createRecurringTask(task);
        }
    }

    function _createRecurringTask(Task storage _originalTask) internal {
        taskCounter++;
        Task storage newTask = tasks[taskCounter];
        newTask.taskId = taskCounter;
        newTask.client = _originalTask.client;
        newTask.description = _originalTask.description;
        newTask.deliveryFormat = _originalTask.deliveryFormat;
        newTask.category = _originalTask.category;
        newTask.bounty = _originalTask.bounty;
        newTask.deadline = block.timestamp + _originalTask.recurringInterval;
        newTask.status = TaskStatus.Open;
        newTask.createdAt = block.timestamp;
        newTask.isRecurring = true;
        newTask.recurringInterval = _originalTask.recurringInterval;

        emit TaskCreated(
            taskCounter,
            _originalTask.client,
            _originalTask.category,
            _originalTask.bounty,
            newTask.deadline,
            _originalTask.description,
            true,
            _originalTask.recurringInterval
        );
    }

    function cancelTask(uint256 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.client == msg.sender, "Not task owner");
        require(
            task.status == TaskStatus.Open || task.status == TaskStatus.Assigned,
            "Cannot cancel"
        );

        uint256 refund = task.bounty;
        task.status = TaskStatus.Cancelled;

        USDC.safeTransfer(msg.sender, refund);

        emit TaskCancelled(_taskId, msg.sender, refund);
    }

    // ==================== DISPUTE SYSTEM ====================

    function openDispute(uint256 _taskId, string memory _reason) external {
        Task storage task = tasks[_taskId];
        require(
            task.client == msg.sender || task.assignedAgent == msg.sender,
            "Not involved in task"
        );
        require(task.status == TaskStatus.Delivered, "Not in delivered state");
        require(!disputes[_taskId].resolved, "Dispute exists");

        Dispute storage dispute = disputes[_taskId];
        dispute.taskId = _taskId;
        dispute.initiator = msg.sender;
        dispute.reason = _reason;
        dispute.createdAt = block.timestamp;
        dispute.resolved = false;

        address[] memory selectedReviewers = _selectReviewers(3);
        dispute.reviewers = selectedReviewers;

        for (uint256 i = 0; i < selectedReviewers.length; i++) {
            if (!isReviewer[selectedReviewers[i]]) {
                isReviewer[selectedReviewers[i]] = true;
                reviewerList.push(selectedReviewers[i]);
            }
        }

        task.status = TaskStatus.Disputed;

        emit DisputeOpened(_taskId, msg.sender, _reason, selectedReviewers);
    }

    function _selectReviewers(uint256 _count) internal view returns (address[] memory) {
        require(registeredAgents.length >= _count, "Not enough agents");

        address[] memory selected = new address[](_count);
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)));

        for (uint256 i = 0; i < _count; i++) {
            uint256 index = uint256(keccak256(abi.encodePacked(seed, i))) % registeredAgents.length;
            selected[i] = registeredAgents[index];
        }

        return selected;
    }

    function voteOnDispute(uint256 _taskId, bool _favorClient) external {
        Dispute storage dispute = disputes[_taskId];
        require(!dispute.resolved, "Already resolved");
        require(_isReviewer(_taskId, msg.sender), "Not a reviewer");
        require(!dispute.votes[msg.sender], "Already voted");

        dispute.votes[msg.sender] = true;

        if (_favorClient) {
            dispute.votesForClient++;
        } else {
            dispute.votesForAgent++;
        }

        emit DisputeVoted(_taskId, msg.sender, _favorClient);

        if (dispute.votesForClient >= 2 || dispute.votesForAgent >= 2) {
            _resolveDispute(_taskId);
        }
    }

    function _isReviewer(uint256 _taskId, address _address) internal view returns (bool) {
        Dispute storage dispute = disputes[_taskId];
        for (uint256 i = 0; i < dispute.reviewers.length; i++) {
            if (dispute.reviewers[i] == _address) {
                return true;
            }
        }
        return false;
    }

    function _resolveDispute(uint256 _taskId) internal {
        Dispute storage dispute = disputes[_taskId];
        Task storage task = tasks[_taskId];

        bool clientWon = dispute.votesForClient > dispute.votesForAgent;
        dispute.resolved = true;

        if (clientWon) {
            USDC.safeTransfer(task.client, task.bounty);

            if (agents[task.assignedAgent].reputationScore >= 50) {
                agents[task.assignedAgent].reputationScore -= 50;
            } else {
                agents[task.assignedAgent].reputationScore = 0;
            }
        } else {
            uint256 protocolFee = (task.bounty * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
            uint256 reviewerFee = (task.bounty * REVIEWER_FEE_BPS) / BPS_DENOMINATOR;
            uint256 agentPayment = task.bounty - protocolFee - reviewerFee;

            protocolFees += protocolFee;
            reviewerPool += reviewerFee;

            agents[task.assignedAgent].pendingEarnings += agentPayment;
            agents[task.assignedAgent].totalEarnings += agentPayment;
            agents[task.assignedAgent].completedTasks++;
            agents[task.assignedAgent].reputationScore += 100;

            if (agents[task.assignedAgent].reputationScore > 1000) {
                agents[task.assignedAgent].reputationScore = 1000;
            }

            _updateAgentTier(task.assignedAgent);
            task.status = TaskStatus.Approved;
        }

        emit DisputeResolved(_taskId, clientWon, dispute.votesForClient, dispute.votesForAgent);
    }

    function resolveDispute(uint256 _taskId) external {
        Dispute storage dispute = disputes[_taskId];
        require(!dispute.resolved, "Already resolved");
        require(
            dispute.votesForClient >= 2 || dispute.votesForAgent >= 2,
            "Not enough votes"
        );

        _resolveDispute(_taskId);
    }

    // ==================== EARNINGS & FEES ====================

    function withdrawEarnings() external nonReentrant {
        Agent storage agent = agents[msg.sender];
        require(agent.pendingEarnings > 0, "No earnings");

        uint256 amount = agent.pendingEarnings;
        agent.pendingEarnings = 0;

        USDC.safeTransfer(msg.sender, amount);

        emit EarningsWithdrawn(msg.sender, amount);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        require(protocolFees > 0, "No fees");

        uint256 amount = protocolFees;
        protocolFees = 0;

        USDC.safeTransfer(owner(), amount);

        emit ProtocolFeesWithdrawn(owner(), amount);
    }

    function withdrawReviewerRewards() external nonReentrant {
        require(isReviewer[msg.sender], "Not a reviewer");
        require(reviewerPool > 0, "No rewards");

        uint256 rewardPerReviewer = reviewerPool / reviewerList.length;
        reviewerPool -= rewardPerReviewer;

        USDC.safeTransfer(msg.sender, rewardPerReviewer);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getTask(uint256 _taskId) external view returns (
        uint256 taskId,
        address client,
        address assignedAgent,
        string memory description,
        TaskCategory category,
        uint256 bounty,
        uint256 deadline,
        TaskStatus status,
        string memory ipfsHash,
        uint256 bidCount,
        bool isRecurring
    ) {
        Task storage task = tasks[_taskId];
        return (
            task.taskId,
            task.client,
            task.assignedAgent,
            task.description,
            task.category,
            task.bounty,
            task.deadline,
            task.status,
            task.ipfsHash,
            task.bidCount,
            task.isRecurring
        );
    }

    function getTaskBids(uint256 _taskId) external view returns (Bid[] memory) {
        return taskBids[_taskId];
    }

    function getAgent(address _agentAddress) external view returns (
        string memory xmtpAddress,
        string memory basename,
        AgentTier tier,
        uint256 reputationScore,
        uint256 completedTasks,
        uint256 totalEarnings,
        uint256 pendingEarnings,
        uint256 stake,
        bool isActive
    ) {
        Agent storage agent = agents[_agentAddress];
        return (
            agent.xmtpAddress,
            agent.basename,
            agent.tier,
            agent.reputationScore,
            agent.completedTasks,
            agent.totalEarnings,
            agent.pendingEarnings,
            agent.stake,
            agent.isActive
        );
    }

    function getAgentSpecialties(address _agentAddress) external view returns (string[] memory) {
        return agents[_agentAddress].specialties;
    }

    function getOpenTasks() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= taskCounter; i++) {
            if (tasks[i].status == TaskStatus.Open) {
                count++;
            }
        }

        uint256[] memory openTasks = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= taskCounter; i++) {
            if (tasks[i].status == TaskStatus.Open) {
                openTasks[index] = i;
                index++;
            }
        }

        return openTasks;
    }

    function getAgentTasks(address _agentAddress) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= taskCounter; i++) {
            if (tasks[i].assignedAgent == _agentAddress) {
                count++;
            }
        }

        uint256[] memory agentTasks = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= taskCounter; i++) {
            if (tasks[i].assignedAgent == _agentAddress) {
                agentTasks[index] = i;
                index++;
            }
        }

        return agentTasks;
    }

    function getClientTasks(address _client) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= taskCounter; i++) {
            if (tasks[i].client == _client) {
                count++;
            }
        }

        uint256[] memory clientTasks = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= taskCounter; i++) {
            if (tasks[i].client == _client) {
                clientTasks[index] = i;
                index++;
            }
        }

        return clientTasks;
    }

    function getDispute(uint256 _taskId) external view returns (
        address initiator,
        string memory reason,
        address[] memory reviewers,
        uint256 votesForClient,
        uint256 votesForAgent,
        bool resolved
    ) {
        Dispute storage dispute = disputes[_taskId];
        return (
            dispute.initiator,
            dispute.reason,
            dispute.reviewers,
            dispute.votesForClient,
            dispute.votesForAgent,
            dispute.resolved
        );
    }

    function getAllAgents() external view returns (address[] memory) {
        return registeredAgents;
    }

    function getTaskCount() external view returns (uint256) {
        return taskCounter;
    }
}
