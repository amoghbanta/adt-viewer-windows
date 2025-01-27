import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Server from '@dr.pogodin/react-native-static-server';

// We assume no more than one instance of this component is mounted in the App
// at any given time; otherwise some additional logic will be needed to ensure
// no more than a single server instance can be launched at a time.
//
// Also, keep in mind, the call to "server.stop()" without "await" does not
// guarantee that the server has shut down immediately after that call, thus
// if such component is unmounted and immediately re-mounted again, the new
// server instance may fail to launch because of it.
export default function ExampleComponent() {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    let server = new Server({
      // See further in the docs how to statically bundle assets into the App,
      // alernatively assets to serve might be created or downloaded during
      // the app's runtime.
      fileDir: 'C:\Users\micro\Desktop\adt\webApp',
    });
    (async () => {
      // You can do additional async preparations here; e.g. on Android
      // it is a good place to extract bundled assets into an accessible
      // location.

      // Note, on unmount this hook resets "server" variable to "undefined",
      // thus if "undefined" the hook has unmounted while we were doing
      // async operations above, and we don't need to launch
      // the server anymore.
      if (server) setOrigin(await server.start());
    })();

    return () => {
      setOrigin('');

      // No harm to trigger .stop() even if server has not been launched yet.
      server.stop();

      server = undefined;
    }
  }, []);

  return (
    <View>
      <Text>Hello World!</Text>
      <Text>Server is up at: {origin}</Text>
    </View>
  );
}