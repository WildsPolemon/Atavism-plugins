using System;
using UnityEngine;

namespace RUSt.UI
{
    public class ConnectionPanel : MonoBehaviour
    {
        public event Action<string, string> OnConnectRequested;

        private string _url = "ws://127.0.0.1:7777";
        private string _name = "Survivor";
        private string _status = "";
        private bool _visible = true;

        public void ShowError(string msg) => _status = msg;
        public void ShowDisconnected() => _status = "Відключено від сервера";
        public void Hide() => _visible = false;

        private void OnGUI()
        {
            if (!_visible) return;

            var w = 360f;
            var h = 200f;
            var x = (Screen.width - w) * 0.5f;
            var y = (Screen.height - h) * 0.5f;

            GUI.Box(new Rect(x, y, w, h), "RUSt — Survival");
            GUI.Label(new Rect(x + 16, y + 36, w - 32, 24), "Сервер (WebSocket)");
            _url = GUI.TextField(new Rect(x + 16, y + 56, w - 32, 28), _url);
            GUI.Label(new Rect(x + 16, y + 92, w - 32, 24), "Ім'я гравця");
            _name = GUI.TextField(new Rect(x + 16, y + 112, w - 32, 28), _name);

            if (GUI.Button(new Rect(x + 16, y + 152, w - 32, 32), "Підключитись"))
                OnConnectRequested?.Invoke(_url, _name);

            if (!string.IsNullOrEmpty(_status))
                GUI.Label(new Rect(x + 16, y + h - 24, w - 32, 20), _status);
        }
    }
}
