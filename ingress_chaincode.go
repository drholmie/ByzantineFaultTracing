package main
import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

type SmartContract struct {
}

type PKI struct {
	Node string `json:"node"`
	Certificate string `json:"certificate"`
}

func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	
	function, args := APIstub.GetFunctionAndParameters()
	
	if function == "getCA" {
		return s.getCA(APIstub, args)
	} else if function == "putCA" {
		return s.putCA(APIstub, args)
	} else if function == "delCA" {
		return s.delCA(APIstub, args)
	} 

	return shim.Error("Invalid Smart Contract function.")
}

func putCA(stub shim.ChaincodeStubInterface, args []string) (string, error) {
		if len(args) != 2 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
		}
		err := stub.PutState(args[0], []byte(args[1]))
		if err != nil {
		return "", fmt.Errorf("Failed to set asset: %s", args[0])
		}
		return args[1], nil
}

func getCA(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
	return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}
	value, err := stub.GetState(args[0])
	if err != nil {
	return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[0], err)
	}
	if value == nil {
	return "", fmt.Errorf("Asset not found: %s", args[0])
	}
	return string(value), nil
}

func delCA(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
	return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}
	err := stub.DelState(args[0])
	if err != nil {
	return "", fmt.Errorf("Failed to delete asset: %s with error: %s", args[0], err)
	}
	return args[0], nil
}

func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
	fmt.Println(“Could not start Chaincode”)
	} else {
	fmt.Println(“Chaincode successfully started”)
	}
}