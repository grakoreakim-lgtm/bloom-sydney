import { $ } from '../admin.js';

export async function render() {
  $('#view-container').innerHTML = `
    <div class="placeholder">
      <h2>Orders — next on the build list</h2>
      <p>Order list with status filters (New / Preparing / Out for delivery / Delivered), order detail view, and a manual entry form for phone orders will live here.</p>
    </div>
  `;
}
