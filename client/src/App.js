// @ts-check
import React, { useEffect, useState } from "react";
import AuctionContract from "./contracts/Auction.json";
import getWeb3 from "./getWeb3";
import ErrorModal from "./components/ErrorModal";
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
  // initial state vars
  const [localWeb3, setLocalWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  // contract interaction state vars
  const [beneficiary, setBeneficiary] = useState(0);
  const [auctionEndTime, setAuctionEndTime] = useState(null);
  const [pendingBalance, setPendingBalance] = useState(null);
  const [contractAccountBalance, setContractAccountBalance] = useState(null);
  const [highestBid, setHighestBid] = useState(null);
  const [bidAmount, setBidAmount] = useState(1);

  // miscellaneous state vars
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);

  // ### Actions
  const refreshAccount = async () => {
    const [_account] = await localWeb3.eth.getAccounts();
    setAccount(_account);

    handleClickGetContractAccountBalance();
    handleClickGetPendingBalance();
    handleClickGetHighestBid();
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
    } catch (error) {
      // Catch any errors for any of the above operations.
      setErrorMessage(error.message);
      setShowError(true);
      console.error(error);
    }
  };

  // endAuction()
  const bid = async () => {
    // await contract.bid({ from: account, value: bidAmount });
    try {
      await contract.methods.bid().send({ from: account, value: bidAmount });
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
    }
  };

  const withdraw = async () => {
    try {
      await contract.methods.withdraw().send({ from: account });
      handleClickGetPendingBalance();
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
    }
  };

  const handleClickEndAuction = async () => {
    try {
      await contract.methods.endAuction().send({ from: account });
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
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
      <ErrorModal open={showError} setOpen={setShowError} message={errorMessage} />
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
        <Message floating>
          <Message.Header>You're using this Account</Message.Header>
          <p>{account}</p>
        </Message>
        <Segment.Inline>
          {account === beneficiary && (
              <Button color="red" onClick={handleClickEndAuction}>
                End Auction
              </Button>
          )}
          <Button
            color="teal"
            floated="right"
            onClick={refreshAccount}
            icon="refresh"
            content="Refresh"
          ></Button>
        </Segment.Inline>
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
              icon: "usd",
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
