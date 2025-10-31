import { AccessToken } from "livekit-server-sdk";

(async function () {
    const devkey = "devkey";
    const secret = "secret";

    const token = new AccessToken(devkey, secret, { identity: "testUser" });
    token.addGrant({ roomJoin: true, room: "testRoom" });

    console.log(await token.toJwt());
})()
