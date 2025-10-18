import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxGraphModule } from '@swimlane/ngx-graph';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxGraphModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  WIDTH = 2000;
  HEIGHT = 2000;

  links = [
    { id: 'a', source: 'commit1', target: 'commit2', label: 'merge' }
  ];
  nodes = [
    { id: 'commit1', label: 'Initial commit', data: { color: '#ff0000' } },
    { id: 'commit2', label: 'Feature added', data: { color: '#00ff00' } }
    ];
}
