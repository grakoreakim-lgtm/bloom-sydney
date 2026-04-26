import { $ } from '../admin.js';

export async function render() {
  $('#view-container').innerHTML = `
    <div class="placeholder">
      <h2>Dashboard — coming with the orders module</h2>
      <p>Today's order count, revenue, low-stock alerts, and upcoming anniversaries will appear here once orders start flowing in.</p>
    </div>
  `;
}
