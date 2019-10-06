package main
import (
	“fmt”
	“github.com/hyperledger/fabric/core/chaincode/shim”
	“github.com/hyperledger/fabric/protos/peer”
	"encoding/json"
	"time"
	"github.com/nu7hatch/gouuid"
)

type Heatmap struct {
	name string
	data string
	timestamp string
}


type Reply struct {
	success bool
	data string
}


type SmartContract struct {

}


func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}


func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()
	
	if function == "verifyHeatMap" {
		return s.verifyHeatMap(stub, args)
	} else if function == "addHeatMap" {
		return s.addHeatMap(stub, args)
	}

	return shim.Error("Invalid function")

}


func (s *SmartContract) addHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 2 {
		return shim.Error("too many arguments")
	}

	hm := Heatmap{arg[0], arg[1], time.now()}
	err := stub.PutState(arg[0], hm)

	if err != nil {
		return shim.Error("error: could not add heatmap")
	}

	return shim.Success(json.Marshal(Reply{true, ""}))
}


func (s *SmartContract) verifyHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 3 {
		return shim.Error("Bad args")
	}

	hm := stub.GetState(args[0]);
	
	if hm == nil {
		return shim.Error("Heatmap doesn't exist")
	}
	
	//do verification

	if true {
		u, err := uuid.NewV4()
		if err != nil {
			return shim.Error("Internal server error")
		}

		return shim.Success(json.Marshal(Reply{true, u.String()}))		
	}
	shutdown(args[2])
	return shim.Error(json.Marshal(Reply{false, ""}));
}


func shutdown(args []string) {
	// shutdown instance and start new one
}


func deleteHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Invalid arguments")
	}

	err := stub.DelState(args[0])
	if err != nil {
		return shim.Error("Delete failed")
	}

	return shim.Success(args[0])
}


func queryHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Invalid arguments")
	}

	hm := stub.GetState(arg[0])
	if hm == nil {
		return shim.Error(json.Marshal(Reply{false, ""}))
	}

	return shim.Success(json.Marshal(Reply{true, hm.data}))
}


func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}