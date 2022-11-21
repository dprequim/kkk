async function login() {
    if (window.ethereum) {
        loginmeta();
    } else {
        walletlogin();
    }
}

async function loginmeta() {
    let user = Moralis.User.current();
    if (!user) {
        user = await Moralis.authenticate();
    }

    $(".btn-disconnect").toggle();
    $(".btn-connect").toggle();
    getSupply();
    getRewards(user.get("ethAddress"));
    getNFTs();
}

async function logOut() {
    await Moralis.User.logOut();
    $(".btn-disconnect").toggle();
    $(".btn-connect").toggle();
    $("#squids").css("display", "none");
    $("#squidpics").html("");
}

async function walletlogin() {
    let user = Moralis.User.current();
    if (!user) {
        user = await Moralis.authenticate({
            provider: "walletconnect",
            chainId: 56,
        });
    }
    getSupply();
    getRewards(user.get("ethAddress"));
    getNFTs();
    $(".btn-disconnect").toggle();
    $(".btn-connect").toggle();
}

async function init() {
    const user = await Moralis.User.current();

    if (user) {
        if (window.localStorage.walletconnect) {
            //alert(window.localStorage.walletconnect);
            await Moralis.enableWeb3({
                provider: "walletconnect",
                chainId: 56,
            });
            $(".btn-disconnect").toggle();
            $(".btn-connect").toggle();
        } else {
            await Moralis.enableWeb3();
            $(".btn-disconnect").toggle();
            $(".btn-connect").toggle();
        }
        getSupply();
        getRewards(user.get("ethAddress"));
        getNFTs();
    } else {
    }
}
async function getSupply() {
    const supply = {
        contractAddress: "0x816030f5A13ebF9E8884313A608530C19D283F4d",
        functionName: "lastSupply",
        abi: abi,
    };

    const lastSupply = await Moralis.executeFunction(supply);

    $("#totalsupply").text(lastSupply + " left from 966");
}

async function getNFTs() {
    const wallet = await Moralis.User.current();

    if (!wallet) {
        return;
    } else {
        $("#squidpics").html("");
        const settings = {
            async: true,
            crossDomain: true,
            url:
                "https://deep-index.moralis.io/api/v2/" +
                wallet.get("ethAddress") +
                "/nft?chain=bsc&format=decimal&token_addresses=0x816030f5A13ebF9E8884313A608530C19D283F4d",
            method: "GET",
            headers: {
                accept: "application/json",
                "X-API-Key":
                    "77uWzAJGAhn7238Jepmu9aBuEuopDVNv3cipYyeN6EBZghXCdncvJJJJQ9iGt845",
            },
        };

        $.ajax(settings).done(function (response) {
            if (response.total > 0) {
                $("#squids").css("display", "block");

                $.each(response.result, function (k, v) {
                    addToGallery(v.token_id);
                });
            }
        });
    }
}

async function addToGallery(tokenid) {
    const tokenuri = {
        contractAddress: "0x816030f5A13ebF9E8884313A608530C19D283F4d",
        functionName: "tokenURI",
        abi: abi,
        params: {
            _id: tokenid,
        },
    };

    const link = await Moralis.executeFunction(tokenuri);

    $.getJSON(link, function (data) {
        var items = [];

        $("#squidpics").append(
            "<div class='col-4' style='margin-bottom:10px;'><a href='" +
                data.image +
                "' target='_blank'><img src='" +
                data.image +
                "'  title='" +
                data.name +
                "'></a><figcaption>Token ID: " +
                tokenid +
                "</figcaption></figure></div>"
        );
    });
}

async function claim() {
    const claim = {
        contractAddress: "0x816030f5A13ebF9E8884313A608530C19D283F4d",
        functionName: "claimRewards",
        abi: abi,
    };

    const ClaimNow = await Moralis.executeFunction(claim);
    const receipt = await ClaimNow.wait();
}

async function getRewards(wallet) {
    const rewards = {
        contractAddress: "0x816030f5A13ebF9E8884313A608530C19D283F4d",
        functionName: "getReflectionBalances",
        abi: abi,
        params: {
            _owner: wallet,
        },
    };

    const getRewards = await Moralis.executeFunction(rewards);
    const rews = getRewards / 1e18;
    $("#rewa").html(rews.toFixed(4) + " BNB");
}

async function mint() {
    var amount = $("#mintamount").val();
    if ($("#mintamount").val() < 1 || $("#mintamount").val() == "") {
        $("#mess").html("Please enter an amount between 1 - 10");
        setTimeout(function () {
            $("#mess").html("");
        }, 8000);
        return;
    }
    const userAddress = await Moralis.User.current();

    if (userAddress) {
        const options = {
            chain: "bsc",
            address: userAddress.get("ethAddress"),
        };
        const balance = await Moralis.Web3API.account.getNativeBalance(options);
        const inwallet = balance.balance / 1e18;

        const cost = {
            contractAddress: "0x816030f5A13ebF9E8884313A608530C19D283F4d",
            functionName: "cost",
            abi: abi,
        };
        const getCosts = await Moralis.executeFunction(cost);
        const finalcost = (getCosts / 1e18) * amount;

        if (inwallet > finalcost) {
            const mint = {
                contractAddress: "0x816030f5A13ebF9E8884313A608530C19D283F4d",
                functionName: "mint",
                abi: abi,
                params: {
                    _mintAmount: $("#mintamount").val(),
                },
                msgValue: Moralis.Units.Token(finalcost, "18"),
            };
            const DoMint = await Moralis.executeFunction(mint);
            $("#mess").html("Minting... please wait a moment...");
            const receipt = await DoMint.wait();
            $("#mess").html("Minted");
            setTimeout(function () {
                $("#mess").html("");
            }, 5000);
            getSupply();
            getNFTs();
        } else {
            alert("Not enough funds");
        }
    } else {
        alert("Please connect wallet first");
    }
}

Moralis.onAccountChanged((account) => {
    Moralis.User.logOut();
    $(".btn-disconnect").toggle();
    $(".btn-connect").toggle();
    $("#squids").css("display", "none");
    $("#squidpics").html("");
});
