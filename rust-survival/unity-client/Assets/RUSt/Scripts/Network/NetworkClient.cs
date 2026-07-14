using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

namespace RUSt.Network
{
    /// <summary>WebSocket client matching shared/protocol.json</summary>
    public class NetworkClient : MonoBehaviour
    {
        public static NetworkClient Instance { get; private set; }

        [SerializeField] private string serverUrl = "ws://127.0.0.1:7777";
        [SerializeField] private string playerName = "Survivor";

        public bool IsConnected { get; private set; }
        public int PlayerId { get; private set; }
        public int WorldSeed { get; private set; }

        public event Action<WelcomeMessage> OnWelcome;
        public event Action<WorldMessage> OnWorld;
        public event Action<PlayersMessage> OnPlayers;
        public event Action<InventoryMessage> OnInventory;
        public event Action<EventMessage> OnEvent;
        public event Action<string> OnError;
        public event Action OnDisconnected;

        private ClientWebSocket _ws;
        private CancellationTokenSource _cts;
        private readonly ConcurrentQueue<string> _incoming = new();
        private readonly object _sendLock = new();

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void SetServerUrl(string url) => serverUrl = url;
        public void SetPlayerName(string name) => playerName = name;

        public async void Connect()
        {
            if (IsConnected) return;
            _cts = new CancellationTokenSource();
            _ws = new ClientWebSocket();
            try
            {
                await _ws.ConnectAsync(new Uri(serverUrl), _cts.Token);
                IsConnected = true;
                _ = ReceiveLoop();
                SendJoin();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RUSt] Connect failed: {ex.Message}");
                OnError?.Invoke(ex.Message);
            }
        }

        public async void Disconnect()
        {
            if (!IsConnected) return;
            IsConnected = false;
            try
            {
                _cts?.Cancel();
                if (_ws?.State == WebSocketState.Open)
                    await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
            }
            catch { /* ignore */ }
            _ws?.Dispose();
            OnDisconnected?.Invoke();
        }

        private void OnDestroy() => Disconnect();

        private void Update()
        {
            while (_incoming.TryDequeue(out var json))
                Dispatch(json);
        }

        private async Task ReceiveLoop()
        {
            var buffer = new byte[8192];
            var segment = new ArraySegment<byte>(buffer);
            while (IsConnected && _ws.State == WebSocketState.Open)
            {
                try
                {
                    var result = await _ws.ReceiveAsync(segment, _cts.Token);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                    var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    _incoming.Enqueue(json);
                }
                catch (OperationCanceledException) { break; }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[RUSt] Receive error: {ex.Message}");
                    break;
                }
            }
            IsConnected = false;
            OnDisconnected?.Invoke();
        }

        private void Dispatch(string json)
        {
            try
            {
                var type = ExtractType(json);
                switch (type)
                {
                    case "S2C_WELCOME":
                        var welcome = JsonUtility.FromJson<WelcomeMessage>(json);
                        PlayerId = welcome.playerId;
                        WorldSeed = welcome.worldSeed;
                        OnWelcome?.Invoke(welcome);
                        break;
                    case "S2C_WORLD":
                        OnWorld?.Invoke(JsonUtility.FromJson<WorldMessage>(json));
                        break;
                    case "S2C_PLAYERS":
                        OnPlayers?.Invoke(JsonUtility.FromJson<PlayersMessage>(json));
                        break;
                    case "S2C_INVENTORY":
                        OnInventory?.Invoke(JsonUtility.FromJson<InventoryMessage>(json));
                        break;
                    case "S2C_EVENT":
                        OnEvent?.Invoke(JsonUtility.FromJson<EventMessage>(json));
                        break;
                    case "S2C_ERROR":
                        var err = JsonUtility.FromJson<ErrorMessage>(json);
                        OnError?.Invoke(err.message);
                        break;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[RUSt] Parse error: {ex.Message}\n{json}");
            }
        }

        private static string ExtractType(string json)
        {
            const string key = "\"t\":\"";
            var i = json.IndexOf(key, StringComparison.Ordinal);
            if (i < 0) return "";
            i += key.Length;
            var j = json.IndexOf('"', i);
            return j > i ? json.Substring(i, j - i) : "";
        }

        public void SendJoin(int? worldSeed = null)
        {
            if (worldSeed.HasValue)
                SendRaw($"{{\"t\":\"C2S_JOIN\",\"name\":\"{Escape(playerName)}\",\"worldSeed\":{worldSeed.Value}}}");
            else
                SendRaw($"{{\"t\":\"C2S_JOIN\",\"name\":\"{Escape(playerName)}\"}}");
        }

        public void SendMove(Vector3 pos, float yaw)
        {
            SendRaw($"{{\"t\":\"C2S_MOVE\",\"x\":{pos.x:F2},\"y\":{pos.y:F2},\"z\":{pos.z:F2},\"yaw\":{yaw:F2}}}");
        }

        public void SendGather(int nodeId) =>
            SendRaw($"{{\"t\":\"C2S_GATHER\",\"nodeId\":{nodeId}}}");

        public void SendPlaceBuilding(string type, Vector3 pos, float yaw) =>
            SendRaw($"{{\"t\":\"C2S_PLACE_BUILDING\",\"type\":\"{type}\",\"x\":{pos.x:F2},\"y\":{pos.y:F2},\"z\":{pos.z:F2},\"yaw\":{yaw:F2}}}");

        public void SendAttack(int targetId) =>
            SendRaw($"{{\"t\":\"C2S_ATTACK\",\"targetId\":{targetId}}}");

        private void SendRaw(string json)
        {
            if (!IsConnected || _ws?.State != WebSocketState.Open) return;
            var bytes = Encoding.UTF8.GetBytes(json);
            lock (_sendLock)
            {
                _ = _ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, _cts.Token);
            }
        }

        private static string Escape(string s) => s.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }
}
