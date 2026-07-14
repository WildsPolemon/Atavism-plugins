using RUSt.Network;
using UnityEngine;

namespace RUSt.UI
{
    public class InventoryHUD : MonoBehaviour
    {
        private InventoryData _inv;
        private string _hint = "E — збір | 1-3 — будівля | ПКМ — поставити | ЛКМ — атака";

        public void ApplyInventory(InventoryMessage msg)
        {
            if (msg?.slots != null) _inv = msg.slots;
        }

        private void OnGUI()
        {
            var style = new GUIStyle(GUI.skin.box) { fontSize = 14, alignment = TextAnchor.UpperLeft };
            var pad = 12;
            if (_inv != null)
            {
                GUI.Box(new Rect(pad, Screen.height - 120, 320, 100),
                    $"Дерево: {_inv.wood}  Камінь: {_inv.stone}\n" +
                    $"Метал: {_inv.metal}  Сірка: {_inv.sulfur}  Тканина: {_inv.cloth}\n" +
                    _hint, style);
            }
            else
            {
                GUI.Box(new Rect(pad, Screen.height - 60, 320, 40), _hint, style);
            }
        }
    }
}
