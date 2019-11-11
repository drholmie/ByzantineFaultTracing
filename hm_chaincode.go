package main
import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
	"encoding/json"
	"time"
	"github.com/nu7hatch/gouuid"
)

type Heatmap struct {
	name string
	data string
	timestamp time.Time
}



type HMChaincode struct {

}



func (s *HMChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	err := stub.PutState("__init__", []byte("0"))
	if err != nil {
		return shim.Error("initError")
	}
	return shim.Success(nil)
}



func (s *HMChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()
	
	if function == "verifyHeatMap" {
		return s.verifyHeatMap(stub, args)
	} 
	else if function == "addHeatMap" {
		return s.addHeatMap(stub, args)
	} 
	else if function == "queryHeatMap" {
		return s.queryHeatMap(stub, args)
	} 
	else if function == "deleteHeatMap" {
		return s.deleteHeatMap(stub, args)
	}

	return shim.Error("invalidFunctionError")

}



func (s *HMChaincode) addHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 2 {
		return shim.Error("argsError")
	}

	hm, merr := json.Marshal(Heatmap{args[0], args[1], time.Now()})
	if merr != nil {
		return shim.Error("addHeatMapError")
	}
	
	err := stub.PutState(args[0], hm)

	if err != nil {
		return shim.Error("addHeatMapError")
	}

	return shim.Success([]byte(args[0]))
}



func (s *HMChaincode) verifyHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 2 {
		return shim.Error("argsError")
	}

	hm, err := stub.GetState(args[0])
	
	if hm == nil || err != nil {
		return shim.Error("noHeatMapError")
	}
	
	//do verification

	if true { //if verification passes. Change true to pass condition
		u, err := uuid.NewV4()
		if err != nil {
			return shim.Error("internalServerError")
		}
		//send uuid to load balancer
		return shim.Success([]byte(u.String()))		
	}
	restartNode(args)
	return shim.Error("failedVerificationError");
}



func restartNode(args []string) {
	// shutdown instance and start new one
	return 
}



func deleteHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("argError")
	}

	err := stub.DelState(args[0])
	if err != nil {
		return shim.Error("noDeleteError")
	}

	return shim.Success([]byte(args[0]))
}



func queryHeatMap(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("argError")
	}

	hm, err := stub.GetState(args[0])
	if hm == nil || err != nil{
		return shim.Error("noHeatMapError")
	}

	return shim.Success(hm)
}



func main() {
	err := shim.Start(new(HMChaincode))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}