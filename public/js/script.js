$(() => {

  let messages = [];
  let peer_id, name, conn;
  const messages_template = Handlebars.compile($('#messages-template').html());

  const peer = new Peer({
    host: 'localhost',
    port: 9000,
    path: '/peerjs',
    debug: 3,
    config: {'iceServers': [
    { url: 'stun:stun1.l.google.com:19302' },
    { url: 'turn:numb.viagenie.ca',
      credential: 'muazkh', username: 'webrtc@live.com' }
    ]}
  });

  peer.on('open', () => {
    $('#id').text(peer.id);
  });

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  const getVideo = (callback) => {
    navigator.getUserMedia({audio: true, video: true}, callback, (error) => {
      console.log(error);
      alert('An error occured. Please try again');
    });
  }

  getVideo((stream) => {
    window.localStream = stream;
    onReceiveStream(stream, 'my-camera');
  });

  const onReceiveStream = (stream, element_id) => {
    const video = $('#' + element_id + ' video')[0];
    // video.src = window.URL.createObjectURL(stream); Depracated
    video.srcObject = stream;
    window.peer_stream = stream;
  }

  $('#login').click(() => {
    name = $('#name').val();
    peer_id = $('#peer_id').val();
    if(peer_id){
      conn = peer.connect(peer_id, {metadata: {
        'username': name
      }});
      conn.on('data', handleMessage);
    }

    $('#chat').removeClass('hidden');
    $('#connect').addClass('hidden');
  });

  peer.on('connection', (connection) => {
    conn = connection;
    peer_id = connection.peer;
    conn.on('data', handleMessage);

    $('#peer_id').addClass('hidden').val(peer_id);
    $('#connected_peer_container').removeClass('hidden');
    $('#connected_peer').text(connection.metadata.username);
  });

  const handleMessage = (data) => {
    const header_plus_footer_height = 285;
    const base_height = $(document).height() - header_plus_footer_height;
    const messages_container_height = $('#messages-container').height();
    messages.push(data);

    const html = messages_template({'messages' : messages});
    $('#messages').html(html);

    if(messages_container_height >= base_height){
      $('html, body').animate({ scrollTop: $(document).height() }, 500);
    }
  }

  const sendMessage = () => {
    const text = $('#message').val();
    const data = {'from': name, 'text': text};

    conn.send(data);
    handleMessage(data);
    $('#message').val('');
  }

  $('#message').keypress((e) => {
    if(e.which == 13){
      sendMessage();
    }
  });

  $('#send-message').click(sendMessage);

  $('#call').click(() => {
    console.log('now calling: ' + peer_id);
    console.log(peer);
    const call = peer.call(peer_id, window.localStream);
    call.on('stream', (stream) => {
      window.peer_stream = stream;
      onReceiveStream(stream, 'peer-camera');
    });
  });

  const onReceiveCall = (call) => {
    call.answer(window.localStream);
    call.on('stream', (stream) => {
      window.peer_stream = stream;
      onReceiveStream(stream, 'peer-camera');
    });
  }

  peer.on('call', (call) => {
    onReceiveCall(call);
  });
});
