import { $ } from '../admin.js';

export async function render() {
  $('#view-container').innerHTML = `
    <div class="placeholder">
      <h2>Customers — after the orders module</h2>
      <p>Customer list with order history, total lifetime value, and notes will be derived from the orders collection.</p>
    </div>
  `;
}
