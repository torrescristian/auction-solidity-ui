// @ts-check
import React, { useEffect, useState } from "react";
import AuctionContract from "./contracts/Auction.json";
import getWeb3 from "./getWeb3";
import {
  Button,
  Container,
  Divider,
  Header,
  Message,
  Segment,
  Input,
} from "semantic-ui-react";

const App = () => {
  const [localWeb3, setLocalWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [allUserAccounts, setAllUserAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [bidAmount, setBidAmount] = useState(1);

  // contract methods
  const [beneficiary, setBeneficiary] = useState(0);
  const [auctionEndTime, setAuctionEndTime] = useState(null);
  const [pendingBalance, setPendingBalance] = useState(null);
  const [contractAccountBalance, setContractAccountBalance] = useState(null);
  const [highestBid, setHighestBid] = useState(null);

  // ### Actions
  const switchAccount = async () => {
    const [_account] = await localWeb3.eth.getAccounts();
    setAccount(_account);
  };

  const connectWallet = async () => {
    try {
      // Get network provider and web3 instance.
      const _web3 = await getWeb3();
      setLocalWeb3(_web3);

      // Use web3 to get the user's accounts.
      const [_account] = await _web3.eth.getAccounts();
      setAccount(_account);

      // Get the contract instance.
      const networkId = await _web3.eth.net.getId();
      const deployedNetwork = AuctionContract.networks[networkId];
      const instance = new _web3.eth.Contract(
        AuctionContract.abi,
        deployedNetwork && deployedNetwork.address
      );
      setContract(instance);

      // get beneficiary
      const _beneficiary = await instance.methods.beneficiary().call();
      setBeneficiary(_beneficiary);

      // get auction end time
      const _auctionEndTime = await instance.methods.auctionEndTime().call();
      setAuctionEndTime(_auctionEndTime);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      // runExample();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  // endAuction()
  const bid = async () => {
    // await contract.bid({ from: account, value: bidAmount });
    try {
      await contract.methods.bid().send({ from: account, value: bidAmount });
    } catch (err) {
      alert(err.message);
    }
  };

  const withdraw = async () => {
    try {
      await contract.methods.withdraw().send({ from: account });
      handleClickGetPendingBalance();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClickEndAuction = async () => {
    try {
      await contract.methods.endAuction().send({ from: account });
    } catch (err) {
      alert(err.message);
    }
  };

  // ### Getters
  const handleClickGetPendingBalance = async () => {
    // Calls are always free and don't cost any Ether, so they're good for calling functions that read data off the blockchain
    const result = await contract.methods.getBalance(account).call();
    console.log({ result });
    setPendingBalance(Number(result));
  };

  const handleClickGetContractAccountBalance = async () => {
    const result = await contract.methods.getContractAccountBalance().call();
    setContractAccountBalance(result);
  };

  const handleClickGetHighestBid = async () => {
    const result = await contract.methods.highest().call();
    console.log(result);
    setHighestBid(result);
  };

  useEffect(() => {
    connectWallet();
  }, []);

  const FormWithButton = ({ title, clickHandler, value }) => {
    return (
      <Message floating>
        <Message.Header>{title}</Message.Header>
        <Input
          placeholder="Unknow"
          value={value === null ? "Unknow" : value}
          action={{
            color: "teal",
            content: "Refresh",
            icon: "refresh",
            onClick: clickHandler,
          }}
        />
      </Message>
    );
  };

  if (!localWeb3) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  return (
    <Container text style={{ marginTop: "2rem" }}>
      <Segment clearing>
        <Header as="h2" floated="right">
          Welcome to this crypto bid!
        </Header>

        <Divider clearing />
        <Message floating>
          <Message.Header>Beneficiary Address</Message.Header>
          <p>{beneficiary}</p>
        </Message>
        <Divider clearing />
        {account === beneficiary && (
          <div>
            <Button color="red" onClick={handleClickEndAuction}>
              End Auction
            </Button>
          </div>
        )}
        <Message floating>
          <Message.Header>You're using this Account</Message.Header>
          <p>{account}</p>
        </Message>
        <Button
          color="teal"
          floated="right"
          onClick={switchAccount}
          icon="refresh"
          content="Refresh Account"
        ></Button>
      </Segment>
      <Segment clearing>
        <Message floating>
          <Message.Header>Enter the amount you want to bid:</Message.Header>
          <Input
            onChange={(e) => {
              const value = Number(e.target.value);
              setBidAmount(value);
            }}
            label={{ basic: true, content: "wei" }}
            labelPosition="right"
            placeholder="Enter Wei..."
            type="number"
            action={{
              content: "Make a bid",
              onClick: bid,
              color: "green",
            }}
            actionPosition="left"
          />
        </Message>
        <FormWithButton
          title="Contract Account Balance"
          clickHandler={handleClickGetContractAccountBalance}
          value={contractAccountBalance}
        />
        <FormWithButton
          title="Pending Balance"
          clickHandler={handleClickGetPendingBalance}
          value={pendingBalance}
        />
        <Message floating>
          <Message.Header>Current highest</Message.Header>
          <p>Amount</p>
          <Input
            placeholder="Unknow"
            value={highestBid ? highestBid.amount : ""}
            label={{ basic: true, content: "wei" }}
            labelPosition="right"
          />
          <p>Address</p>
          <Input
            action={{
              color: "teal",
              content: "Refresh",
              icon: "refresh",
              onClick: handleClickGetHighestBid,
            }}
            fluid
            placeholder="Unknow"
            value={highestBid ? highestBid.bidder : ""}
          />
        </Message>
        {!!pendingBalance && (
          <Message floating>
            <Message.Header>Current highest</Message.Header>
            <p>Address</p>
            <Input
              action={{
                color: "teal",
                content: "Withdraw",
                icon: "money bill alternate outline",
                onClick: withdraw,
              }}
              disabled
              placeholder="Unknow"
              value={highestBid && highestBid.bidder}
            />
          </Message>
        )}
      </Segment>
    </Container>
  );
};

export default App;
